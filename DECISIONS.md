# Architecture & Implementation Decisions

## 1. Places API (New) vs Legacy API

**Decision:** Use Google Places API (New) — `places.googleapis.com/v1/` — exclusively.

**Rationale:** The user's Google Cloud project has only the Places API (New) enabled. The legacy API (`maps.googleapis.com/maps/api/place/`) returned `REQUEST_DENIED`. The New API also offers better field granularity, consistent JSON responses, and is Google's recommended path forward.

**Trade-offs:**
- ✅ Future-proof; legacy API deprecated
- ✅ Cleaner field mask headers instead of query params
- ⚠️ Different field names need careful mapping (e.g., `displayName.text`, `userRatingCount`)
- ⚠️ `searchNearby` returns max 20 results (no pagination tokens)

**Rollback:** Switch `GOOGLE_NEARBY_SEARCH_URL` and `DETAIL_FIELD_MASK` back to legacy URLs and fields.

---

## 2. Unified `places` Table vs Separate Category Tables

**Decision:** Single `places` table with `category` and `type` columns.

**Rationale:** The original schema had separate tables (`food_items`, `accommodations`, `study_spots`, `essentials`). A unified table:
- Simplifies the backend to one set of CRUD endpoints
- Enables cross-category search and filtering
- Reduces migration complexity when adding new categories
- Frontend hooks use adapter functions to map unified schema → component-specific interfaces

**Trade-offs:**
- ✅ Single API endpoint for all categories
- ✅ Fewer tables, indexes, and RLS policies to maintain
- ⚠️ Slightly wider table with nullable fields

---

## 3. Photo Proxy vs Direct Google Photo URLs

**Decision:** Backend photo proxy at `GET /api/places/:id/photo/:index`.

**Rationale:**
- **Security:** Google API key never exposed to frontend
- **Compliance:** Google Places ToS requires attribution display; proxy adds `X-Photo-Attribution` header
- **Performance:** `Cache-Control: public, max-age=604800` (7 days) reduces repeat API calls
- **Fallback:** If no photo_refs exist, frontend falls back to Unsplash placeholder

**Trade-offs:**
- ✅ API key secure, attribution preserved, cacheable
- ⚠️ Adds latency (backend fetches image, then streams to client)
- ⚠️ Backend bandwidth consumption

---

## 4. TTL-Based Caching Strategy

**Decision:** Field-level TTLs stored as constants; checked via `last_fetched_at` timestamp.

| Field | TTL | Rationale |
|---|---|---|
| name/address/coords | 30 days | Rarely changes |
| rating | 6 hours | Reasonably fresh |
| opening_hours/open_now | 15 minutes | Changes frequently |
| reviews | 24 hours | Daily refresh |
| photo_refs | 30 days | Stable |

**Trade-offs:**
- ✅ Balances API cost vs data freshness
- ✅ Single `last_fetched_at` check simplifies logic
- ⚠️ All live fields refresh together (driven by shortest TTL on detail view)

---

## 5. Spatial Indexing — BTREE Fallback

**Decision:** Use `BTREE(lat, lng)` index with PostGIS GIST variant in comments.

**Rationale:** Supabase doesn't enable PostGIS by default. The BTREE index supports range queries (bounding box) which covers the primary use case. PostGIS instructions are documented for users who enable the extension.

**Rollback:** Enable PostGIS and replace with `GIST(ST_MakePoint(lng, lat)::geography)`.

---

## 6. Photo Storage: Reference-Only Policy

**Decision:** Store only `photo_reference` strings and attribution metadata (not binary images).

**Rationale:**
- Google Places ToS prohibits persistent caching of place data beyond 30 days
- Storing binary images in Supabase Storage requires attribution retention and TTL cleanup
- Reference-only approach + backend proxy satisfies requirements with zero storage cost

**Legal Note:** If `CACHE_PHOTOS_TO_STORAGE=true` is enabled in the future, the operator must:
- Respect Google's 30-day cache policy
- Retain and display `html_attributions` alongside cached images
- Implement automated cleanup of expired cached photos

---

## 7. Photo Proxy: Cross-Origin-Resource-Policy Header

**Date:** 2026-02-28
**Status:** Implemented

**Context:**
Place photos from the Google Places API cannot be fetched directly from the frontend because
the Google API key must remain server-side. A photo proxy endpoint
(`GET /api/places/:id/photo/:index`) was added to the Express backend to fetch and stream
photo data using the server-side API key.

**Problem:**
Browsers blocked the photo proxy responses with a CORP (Cross-Origin-Resource-Policy) error
when the `<img>` elements on the frontend attempted to load photos from a different origin
(the backend URL vs. the frontend URL).

**Decision:**
Add the header `Cross-Origin-Resource-Policy: cross-origin` to all responses from the photo
proxy endpoint. This explicitly permits cross-origin image loading from the proxy.

**Consequences:**
- ✅ Photos load correctly across origins in production
- ✅ The header is scoped to the photo proxy route only, not applied globally
- ⚠️ Future proxy endpoints serving binary content to cross-origin clients should apply the
  same header pattern

