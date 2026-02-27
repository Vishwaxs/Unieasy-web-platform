// server/lib/placesService.js
// Google Places live-fetch logic and TTL checks for place detail endpoint.

import logger from "./logger.js";
import { RATING_TTL, OPENING_HOURS_TTL } from "./constants.js";

const GOOGLE_PLACE_DETAILS_URL =
    "https://maps.googleapis.com/maps/api/place/details/json";

const GOOGLE_API_KEY = process.env.GOOGLE_PLACES_API_KEY;

// ─── TTL check ───────────────────────────────────────────────────────────────

/**
 * Check if live fields are stale based on last_fetched_at.
 * Returns true if any live field exceeds its TTL.
 */
export function isLiveDataStale(lastFetchedAt) {
    if (!lastFetchedAt) return true;

    const lastFetch = new Date(lastFetchedAt).getTime();
    const now = Date.now();

    // Check against the shortest TTL (opening hours = 15 min)
    // If opening hours TTL is expired, we should refresh.
    // Rating TTL is 6 hours — also check.
    const ratingStale = now - lastFetch > RATING_TTL;
    const openingStale = now - lastFetch > OPENING_HOURS_TTL;

    return ratingStale || openingStale;
}

// ─── Exponential backoff fetch ───────────────────────────────────────────────

/**
 * Fetch Google Place Details with exponential backoff.
 * Max 3 retries. Returns parsed JSON or null on failure.
 */
async function fetchWithBackoff(url, params, retries = 3) {
    const searchParams = new URLSearchParams({ ...params, key: GOOGLE_API_KEY });
    const fullUrl = `${url}?${searchParams.toString()}`;

    let wait = 1000; // 1s initial

    for (let attempt = 1; attempt <= retries; attempt++) {
        const start = Date.now();

        try {
            const response = await fetch(fullUrl);
            const data = await response.json();
            const latency = Date.now() - start;

            logger.info(
                {
                    place_id: params.place_id,
                    fields: params.fields,
                    status: data.status,
                    latency_ms: latency,
                },
                "Google Place Details API call"
            );

            if (data.status === "OK") {
                return data;
            }

            if (
                data.status === "OVER_QUERY_LIMIT" ||
                response.status === 500
            ) {
                logger.warn(
                    { status: data.status, attempt },
                    "Retryable Google API error"
                );
            } else {
                // Non-retryable error
                logger.error(
                    {
                        status: data.status,
                        error: data.error_message,
                        place_id: params.place_id,
                    },
                    "Google Place Details API error (non-retryable)"
                );
                return null;
            }
        } catch (err) {
            const latency = Date.now() - start;
            logger.error(
                { err, attempt, latency_ms: latency, place_id: params.place_id },
                "Google Place Details fetch exception"
            );
        }

        // Exponential backoff: 1s, 2s, 4s
        if (attempt < retries) {
            await new Promise((r) => setTimeout(r, wait));
            wait *= 2;
        }
    }

    logger.error(
        { place_id: params.place_id },
        `Google Place Details: max retries (${retries}) exhausted`
    );
    return null;
}

// ─── Fetch and update place details ──────────────────────────────────────────

/**
 * Fetch live data from Google Place Details API and update the Supabase row.
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

    const fields = [
        "rating",
        "user_ratings_total",
        "opening_hours",
        "business_status",
        "reviews",
        "photos",
    ].join(",");

    const data = await fetchWithBackoff(GOOGLE_PLACE_DETAILS_URL, {
        place_id: place.google_place_id,
        fields,
    });

    if (!data || data.status !== "OK") {
        return { updatedPlace: place, liveFetch: false, liveFetchError: true };
    }

    const result = data.result;
    const now = new Date().toISOString();

    // Build update payload — only live fields
    const extra = { ...(place.extra || {}) };

    if (result.opening_hours) {
        extra.opening_hours = result.opening_hours;
    }
    if (result.business_status) {
        extra.business_status = result.business_status;
    }
    if (result.reviews) {
        // Store top 3 reviews
        extra.reviews = result.reviews.slice(0, 3).map((r) => ({
            author: r.author_name,
            rating: r.rating,
            text: r.text,
            time: r.time,
            relative_time: r.relative_time_description,
        }));
    }

    // Photo refs — top 5
    let photoRefs = place.photo_refs || [];
    if (result.photos && result.photos.length > 0) {
        photoRefs = result.photos
            .slice(0, 5)
            .map((p) => p.photo_reference)
            .filter(Boolean);
    }

    const updatePayload = {
        rating: result.rating ?? place.rating,
        rating_count: result.user_ratings_total ?? place.rating_count,
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
