# Autonomous Run State

Short handoff note for the deep-work autonomous routine. Update at the end of each run.

## Last run — 2026-08-02

**Change:** Fixed the failing `useSyncUser` unit test. The hook records
`last_active_at` on every user upsert, but the test asserted an exact payload
without it, leaving the Vitest suite red (`1 failed | 4 passed`). Updated the
assertion to `expect.objectContaining(...)` with an ISO-8601 `stringMatching`
matcher for `last_active_at`.

**Files changed:**
- `src/__tests__/useSyncUser.test.tsx`

**Commands run:**
- `npm test` → `Test Files 2 passed (2)`, `Tests 5 passed (5)` (was 1 failed)
- `npx eslint src/__tests__/useSyncUser.test.tsx` → clean
- `npx tsc --noEmit` → exit 0

**Follow-up (same run, CI drive-to-green):** `frontend-ci` was failing on the
"Key leak check" step because a Google Maps Embed API key was hardcoded in
three detail pages and compiled into the public `dist` bundle. Extracted an
env-only helper (`src/lib/maps.ts`, reads `VITE_GOOGLE_MAPS_EMBED_KEY`, returns
`null` when unset) with a keyless "View on Google Maps" fallback link, and
removed all hardcoded keys.
- Files: `src/lib/maps.ts` (new), `src/__tests__/maps.test.ts` (new),
  `src/pages/PlaceItemDetails.tsx`, `src/pages/FoodRestaurantDetails.tsx`,
  `src/pages/AccommodationItemDetails.tsx`
- Verified: `vite build` ✓, `grep -r AIza dist/` → no match ✓, `tsc` ✓,
  `eslint` ✓, `vitest` 7/7 ✓
- ⚠️ The leaked key is in git history — it must be **rotated in Google Cloud**;
  removing it from source does not un-leak it.

**PR:** #24 (draft) on branch `claude/sweet-galileo-kamlli`. Vercel preview: Ready.

## Suggested next smallest steps

- Add unit tests for `src/lib/reviewStats.ts` (pure, defensively-written,
  currently untested): `computeCombinedReviewStats`, `getAverageEmoji`,
  `formatCompactCount` edge cases.
- Only `src/__tests__/useSyncUser.test.tsx` and `src/test/example.test.ts`
  exist as frontend tests — coverage of the data hooks and `src/lib` utils is
  thin and would be the highest-value next area.
