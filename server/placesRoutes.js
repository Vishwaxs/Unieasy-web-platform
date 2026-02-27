// server/placesRoutes.js
// Express router for public places API endpoints.
// No Clerk authentication required — these are public read endpoints.
// Google API calls originate from this backend only.

import { Router } from "express";
import { supabaseAdmin } from "./lib/supabaseAdmin.js";
import { isLiveDataStale, fetchAndUpdatePlaceDetails } from "./lib/placesService.js";
import { VALID_CATEGORIES } from "./lib/constants.js";
import logger from "./lib/logger.js";

const router = Router();

// ─── Helpers ─────────────────────────────────────────────────────────────────

/**
 * Validate UUID format.
 */
function isValidUUID(str) {
    return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str);
}

/**
 * Parse integer with fallback.
 */
function parseIntParam(value, defaultValue, min = 0, max = Infinity) {
    if (value === undefined || value === null) return defaultValue;
    const parsed = parseInt(value, 10);
    if (isNaN(parsed)) return defaultValue;
    return Math.max(min, Math.min(parsed, max));
}

// ═══════════════════════════════════════════════════════════════════════════════
// GET /api/places — List places with filters
// ═══════════════════════════════════════════════════════════════════════════════

router.get("/places", async (req, res) => {
    const start = Date.now();

    try {
        const {
            category,
            type,
            bbox,
            is_on_campus,
        } = req.query;

        const limit = parseIntParam(req.query.limit, 50, 1, 200);
        const offset = parseIntParam(req.query.offset, 0, 0);

        // ── Validate params ────────────────────────────────────────────────────
        if (category && !VALID_CATEGORIES.includes(category)) {
            return res.status(400).json({
                error: `Invalid category. Must be one of: ${VALID_CATEGORIES.join(", ")}`,
            });
        }

        if (is_on_campus !== undefined && !["true", "false"].includes(is_on_campus)) {
            return res.status(400).json({
                error: "is_on_campus must be 'true' or 'false'.",
            });
        }

        // ── Build query ────────────────────────────────────────────────────────
        let query = supabaseAdmin
            .from("places")
            .select("*", { count: "exact" });

        if (category) {
            query = query.eq("category", category);
        }

        if (type) {
            query = query.eq("type", type);
        }

        if (is_on_campus !== undefined) {
            query = query.eq("is_on_campus", is_on_campus === "true");
        }

        // Bounding box filter: "lat1,lng1,lat2,lng2" (SW corner, NE corner)
        if (bbox) {
            const parts = bbox.split(",").map((s) => parseFloat(s.trim()));
            if (parts.length !== 4 || parts.some(isNaN)) {
                return res.status(400).json({
                    error: 'Invalid bbox format. Use "lat1,lng1,lat2,lng2".',
                });
            }
            const [lat1, lng1, lat2, lng2] = parts;
            const minLat = Math.min(lat1, lat2);
            const maxLat = Math.max(lat1, lat2);
            const minLng = Math.min(lng1, lng2);
            const maxLng = Math.max(lng1, lng2);

            query = query
                .gte("lat", minLat)
                .lte("lat", maxLat)
                .gte("lng", minLng)
                .lte("lng", maxLng);
        }

        // Pagination
        query = query
            .order("rating", { ascending: false, nullsFirst: false })
            .range(offset, offset + limit - 1);

        const { data, error, count } = await query;

        if (error) {
            logger.error({ err: error }, "GET /places query error");
            return res.status(500).json({ error: error.message });
        }

        const latency = Date.now() - start;
        logger.info(
            { method: "GET", path: "/places", params: req.query, status: 200, latency_ms: latency },
            "places list"
        );

        return res.json({
            data: data || [],
            count: count || 0,
            offset,
            limit,
        });

    } catch (err) {
        const latency = Date.now() - start;
        logger.error({ err, latency_ms: latency }, "GET /places unexpected error");
        return res.status(500).json({ error: "Internal server error" });
    }
});

// ═══════════════════════════════════════════════════════════════════════════════
// GET /api/places/:id — Single place with optional live Google fetch
// ═══════════════════════════════════════════════════════════════════════════════

router.get("/places/:id", async (req, res) => {
    const start = Date.now();
    const { id } = req.params;

    // Validate UUID
    if (!isValidUUID(id)) {
        return res.status(400).json({ error: "Invalid place ID format. Must be a UUID." });
    }

    try {
        // 1. Fetch the row from Supabase
        const { data: place, error } = await supabaseAdmin
            .from("places")
            .select("*")
            .eq("id", id)
            .single();

        if (error || !place) {
            return res.status(404).json({ error: "Not found" });
        }

        // 2. If no google_place_id or manual skeleton → return as-is
        if (!place.google_place_id || place.data_source === "manual_skeleton") {
            const latency = Date.now() - start;
            logger.info(
                { method: "GET", path: `/places/${id}`, status: 200, live_fetch: false, latency_ms: latency },
                "place detail (static)"
            );
            return res.json({
                ...place,
                live_fetch: false,
                last_fetched_at: place.last_fetched_at,
            });
        }

        // 3. If on-campus + manual override → return as-is
        if (place.is_on_campus && place.is_manual_override) {
            const latency = Date.now() - start;
            logger.info(
                { method: "GET", path: `/places/${id}`, status: 200, live_fetch: false, latency_ms: latency },
                "place detail (manual override)"
            );
            return res.json({
                ...place,
                live_fetch: false,
                last_fetched_at: place.last_fetched_at,
            });
        }

        // 4. Check TTL — if stale, do live fetch
        if (isLiveDataStale(place.last_fetched_at)) {
            const { updatedPlace, liveFetch, liveFetchError } =
                await fetchAndUpdatePlaceDetails(supabaseAdmin, place);

            const latency = Date.now() - start;
            logger.info(
                {
                    method: "GET",
                    path: `/places/${id}`,
                    status: 200,
                    live_fetch: liveFetch,
                    live_fetch_error: liveFetchError,
                    latency_ms: latency,
                },
                "place detail (live fetch attempted)"
            );

            const response = {
                ...updatedPlace,
                live_fetch: liveFetch,
                last_fetched_at: updatedPlace.last_fetched_at,
            };

            if (liveFetchError) {
                response.live_fetch_error = true;
            }

            return res.json(response);
        }

        // 5. Data is within TTL — return cached
        const latency = Date.now() - start;
        logger.info(
            { method: "GET", path: `/places/${id}`, status: 200, live_fetch: false, latency_ms: latency },
            "place detail (cached)"
        );

        return res.json({
            ...place,
            live_fetch: false,
            last_fetched_at: place.last_fetched_at,
        });

    } catch (err) {
        const latency = Date.now() - start;
        logger.error({ err, latency_ms: latency }, `GET /places/${id} unexpected error`);
        return res.status(500).json({ error: "Internal server error" });
    }
});

// ═══════════════════════════════════════════════════════════════════════════════
// GET /api/places/:id/photo/:index — Photo proxy
// Streams Google Place photo server-side. Never exposes API key to client.
// ═══════════════════════════════════════════════════════════════════════════════

const GOOGLE_API_KEY = process.env.GOOGLE_PLACES_API_KEY;
const CACHE_PHOTOS = process.env.CACHE_PHOTOS_TO_STORAGE === "true";
const PHOTO_CACHE_MAX_AGE = 7 * 24 * 60 * 60; // 7 days in seconds

router.get("/places/:id/photo/:index", async (req, res) => {
    const start = Date.now();
    const { id, index: rawIndex } = req.params;

    // Validate UUID
    if (!isValidUUID(id)) {
        return res.status(400).json({ error: "Invalid place ID format." });
    }

    // Validate index
    const index = parseInt(rawIndex, 10);
    if (isNaN(index) || index < 0 || index > 9) {
        return res.status(400).json({ error: "Photo index must be 0-9." });
    }

    if (!GOOGLE_API_KEY) {
        return res.status(503).json({ error: "Photo proxy not configured." });
    }

    try {
        // 1. Fetch place row to get photo_refs
        const { data: place, error } = await supabaseAdmin
            .from("places")
            .select("id, photo_refs")
            .eq("id", id)
            .single();

        if (error || !place) {
            return res.status(404).json({ error: "Place not found." });
        }

        const photoRefs = place.photo_refs || [];
        if (index >= photoRefs.length) {
            return res.status(404).json({ error: `No photo at index ${index}. Available: ${photoRefs.length}` });
        }

        const photoEntry = photoRefs[index];

        // Support both old format (string) and new format (object with ref)
        const photoName = typeof photoEntry === "string" ? photoEntry : photoEntry?.ref;
        const attributions = typeof photoEntry === "object" ? (photoEntry?.html_attributions || []) : [];

        if (!photoName) {
            return res.status(404).json({ error: "Photo reference is empty." });
        }

        // 2. Build Google Places Photo Media URL (New API)
        // New API format: GET https://places.googleapis.com/v1/{photoName}/media?maxWidthPx=800&key=...
        // photoName is like "places/ChIJ.../photos/AUG..."
        const photoUrl = `https://places.googleapis.com/v1/${photoName}/media?maxWidthPx=800&skipHttpRedirect=true&key=${GOOGLE_API_KEY}`;

        const googleRes = await fetch(photoUrl);

        if (!googleRes.ok) {
            logger.warn(
                { placeId: id, index, status: googleRes.status },
                "Google Photo Media API error"
            );
            return res.status(502).json({ error: "Failed to fetch photo from Google." });
        }

        const photoData = await googleRes.json();
        const imageUrl = photoData.photoUri;

        if (!imageUrl) {
            return res.status(502).json({ error: "No photo URI in Google response." });
        }

        // 3. Fetch the actual image
        const imageRes = await fetch(imageUrl);

        if (!imageRes.ok) {
            return res.status(502).json({ error: "Failed to stream photo." });
        }

        // 4. Set headers and stream
        const contentType = imageRes.headers.get("content-type") || "image/jpeg";
        res.set("Content-Type", contentType);
        res.set("Cache-Control", `public, max-age=${PHOTO_CACHE_MAX_AGE}`);
        res.set("X-Photo-Attribution", JSON.stringify(attributions));
        // Allow cross-origin loading (frontend on :5173, backend on :8080)
        res.set("Cross-Origin-Resource-Policy", "cross-origin");

        // Stream the image bytes to client
        const arrayBuffer = await imageRes.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);

        const latency = Date.now() - start;
        logger.info(
            { method: "GET", path: `/places/${id}/photo/${index}`, latency_ms: latency },
            "photo proxy served"
        );

        return res.send(buffer);

    } catch (err) {
        const latency = Date.now() - start;
        logger.error({ err, latency_ms: latency }, `GET /places/${id}/photo/${rawIndex} error`);
        return res.status(500).json({ error: "Internal server error" });
    }
});

export default router;
