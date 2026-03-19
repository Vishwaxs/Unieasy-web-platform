// server/lib/placesService.js
// Google Places API (New) — live-fetch logic and TTL checks for place detail endpoint.
// Uses the new REST API: GET https://places.googleapis.com/v1/places/{id}

import logger from "./logger.js";
import { RATING_TTL, OPENING_HOURS_TTL, DETAIL_FIELD_MASK } from "./constants.js";

const GOOGLE_API_KEY = process.env.GOOGLE_PLACES_API_KEY;

// ─── TTL check ───────────────────────────────────────────────────────────────

/**
 * Check if live fields are stale based on last_fetched_at.
 * Returns true if the shortest TTL (opening hours = 15 min) has expired.
 */
export function isLiveDataStale(lastFetchedAt) {
    if (!lastFetchedAt) return true;

    const lastFetch = new Date(lastFetchedAt).getTime();
    const now = Date.now();

    // Check against the shortest TTL (opening hours = 15 min)
    const openingStale = now - lastFetch > OPENING_HOURS_TTL;
    const ratingStale = now - lastFetch > RATING_TTL;

    return ratingStale || openingStale;
}

// ─── Exponential backoff fetch ───────────────────────────────────────────────

/**
 * Fetch from Google Places API (New) with exponential backoff.
 * Max 3 retries. Returns parsed JSON or null on failure.
 *
 * Uses GET https://places.googleapis.com/v1/places/{placeId}
 * with X-Goog-Api-Key and X-Goog-FieldMask headers.
 */
async function fetchWithBackoff(placeId, retries = 3) {
    // New API uses the place ID directly in the URL path
    // If the placeId looks like a legacy ID (ChIJ...), prefix with "places/"
    const resourceName = placeId.startsWith("places/")
        ? placeId
        : `places/${placeId}`;

    const url = `https://places.googleapis.com/v1/${resourceName}`;

    const headers = {
        "X-Goog-Api-Key": GOOGLE_API_KEY,
        "X-Goog-FieldMask": DETAIL_FIELD_MASK,
    };

    let wait = 1000; // 1s initial

    for (let attempt = 1; attempt <= retries; attempt++) {
        const start = Date.now();

        try {
            const response = await fetch(url, { headers });
            const latency = Date.now() - start;

            // Rate limited
            if (response.status === 429) {
                logger.warn(
                    { placeId, attempt, latency_ms: latency },
                    "Google Places API rate limited (429)"
                );
                if (attempt < retries) {
                    await new Promise((r) => setTimeout(r, wait));
                    wait *= 2;
                    continue;
                }
                return null;
            }

            // Forbidden / auth error
            if (response.status === 403) {
                const errBody = await response.json().catch(() => ({}));
                logger.error(
                    { placeId, status: 403, error: errBody?.error?.message },
                    "Google Places API 403 Forbidden"
                );
                return null;
            }

            // Other client errors — don't retry
            if (response.status >= 400 && response.status < 500) {
                const errBody = await response.json().catch(() => ({}));
                logger.error(
                    { placeId, status: response.status, error: errBody?.error?.message, latency_ms: latency },
                    "Google Places API client error (non-retryable)"
                );
                return null;
            }

            // Server error — retry
            if (response.status >= 500) {
                logger.warn(
                    { placeId, status: response.status, attempt, latency_ms: latency },
                    "Google Places API server error (retryable)"
                );
                if (attempt < retries) {
                    await new Promise((r) => setTimeout(r, wait));
                    wait *= 2;
                    continue;
                }
                return null;
            }

            // Success
            const data = await response.json();
            logger.info(
                { placeId, latency_ms: latency },
                "Google Place Details API call (New API)"
            );
            return data;

        } catch (err) {
            const latency = Date.now() - start;
            logger.error(
                { err, attempt, latency_ms: latency, placeId },
                "Google Place Details fetch exception"
            );
        }

        // Exponential backoff: 1s, 2s, 4s
        if (attempt < retries) {
            await new Promise((r) => setTimeout(r, wait));
            wait *= 2;
        }
    }

    logger.error({ placeId }, `Google Place Details: max retries (${retries}) exhausted`);
    return null;
}

// ─── Map priceLevel enum string to integer ───────────────────────────────────

const PRICE_LEVEL_MAP = {
    PRICE_LEVEL_FREE: 0,
    PRICE_LEVEL_INEXPENSIVE: 1,
    PRICE_LEVEL_MODERATE: 2,
    PRICE_LEVEL_EXPENSIVE: 3,
    PRICE_LEVEL_VERY_EXPENSIVE: 4,
};

// ─── Fetch and update place details ──────────────────────────────────────────

/**
 * Fetch live data from Google Places API (New) and update the Supabase row.
 *
 * New API response field names:
 *   rating → rating (number, same name)
 *   userRatingCount → rating_count
 *   currentOpeningHours → opening_hours in extra
 *   businessStatus → business_status in extra
 *   reviews → top 3 reviews in extra
 *   photos → photo_refs as objects { ref, width, height, html_attributions }
 *   internationalPhoneNumber → phone
 *   websiteUri → website
 *
 * @param {object} supabaseAdmin - Supabase client with service role
 * @param {object} place - The existing place row from DB
 * @returns {{ updatedPlace: object, liveFetch: boolean, liveFetchError: boolean }}
 */
export async function fetchAndUpdatePlaceDetails(supabaseAdmin, place) {
    if (!GOOGLE_API_KEY) {
        logger.warn("GOOGLE_PLACES_API_KEY not set — skipping live fetch");
        return { updatedPlace: place, liveFetch: false, liveFetchError: true };
    }

    const data = await fetchWithBackoff(place.google_place_id);

    if (!data) {
        return { updatedPlace: place, liveFetch: false, liveFetchError: true };
    }

    const now = new Date().toISOString();

    // Build update payload — only live fields
    const extra = { ...(place.extra || {}) };

    // Opening hours (New API: currentOpeningHours)
    if (data.currentOpeningHours) {
        extra.opening_hours = {
            openNow: data.currentOpeningHours.openNow,
            periods: data.currentOpeningHours.periods,
            weekdayDescriptions: data.currentOpeningHours.weekdayDescriptions,
        };
    }

    // Business status (New API: businessStatus)
    if (data.businessStatus) {
        extra.business_status = data.businessStatus;
    }

    // Reviews — store top 3 (New API: reviews array)
    if (data.reviews && data.reviews.length > 0) {
        extra.reviews = data.reviews.slice(0, 3).map((r) => ({
            author: r.authorAttribution?.displayName || "Anonymous",
            rating: r.rating,
            text: r.text?.text || "",
            publishTime: r.publishTime,
            relativePublishTime: r.relativePublishTimeDescription,
        }));
    }

    // Photo refs — top 5 as objects with attribution (New API: photos[].name)
    let photoRefs = place.photo_refs || [];
    if (data.photos && data.photos.length > 0) {
        photoRefs = data.photos.slice(0, 5).map((p) => ({
            ref: p.name || "",
            width: p.widthPx || null,
            height: p.heightPx || null,
            html_attributions: (p.authorAttributions || []).map(
                (a) => a.displayName || ""
            ),
        }));
    }

    // Vegetarian food signal (New API: servesVegetarianFood)
    if (typeof data.servesVegetarianFood === "boolean") {
        extra.serves_vegetarian_food = data.servesVegetarianFood;
    }

    // Price level (New API: enum string → int)
    const priceLevel = data.priceLevel
        ? (PRICE_LEVEL_MAP[data.priceLevel] ?? place.price_level)
        : place.price_level;

    const updatePayload = {
        rating: data.rating ?? place.rating,
        rating_count: data.userRatingCount ?? place.rating_count,
        price_level: priceLevel,
        phone: data.internationalPhoneNumber || place.phone,
        website: data.websiteUri || place.website,
        extra,
        photo_refs: photoRefs,
        last_fetched_at: now,
        // updated_at is auto-set by trigger
    };

    try {
        const { data: updated, error } = await supabaseAdmin
            .from("places")
            .update(updatePayload)
            .eq("id", place.id)
            .select()
            .single();

        if (error) {
            logger.error({ err: error, placeId: place.id }, "Failed to update place after live fetch");
            return { updatedPlace: place, liveFetch: true, liveFetchError: true };
        }

        return { updatedPlace: updated, liveFetch: true, liveFetchError: false };
    } catch (err) {
        logger.error({ err, placeId: place.id }, "Exception updating place after live fetch");
        return { updatedPlace: place, liveFetch: true, liveFetchError: true };
    }
}
