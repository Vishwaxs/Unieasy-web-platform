# Autonomous Run State

## 2026-07-11 — Fix stale `useSyncUser` test

**Change:** Updated `src/__tests__/useSyncUser.test.tsx` to match the current
`useSyncUser` hook contract. The hook writes a `last_active_at` timestamp into
the Supabase upsert payload, but the exact-payload assertion in the test did
not account for it, so the suite was red. The assertion now expects
`last_active_at: expect.any(String)` and additionally verifies it is a valid
ISO-8601 timestamp.

**Verification:**
- `npx vitest run` → 5 passed / 5 (was 1 failed / 5)
- `npx tsc --noEmit` → exit 0

**Status:** Test suite green; typecheck clean.

**Next smallest step:** Add unit tests for `src/lib/reviewStats.ts`
(`getAverageEmoji`, `computeCombinedReviewStats`, `formatCompactCount`) — pure,
edge-case-heavy logic with no current coverage.

---

### Pre-existing CI blocker discovered (NOT caused by this PR)

PR #13's `frontend-ci` job fails at the **key-leak gate**
(`grep "AIza" dist/`), independent of this change (this PR touches only a
test file + this summary). A hardcoded Google Maps **Embed** API key
`AIzaSyBFw0Qbyq9zTFTd-tUY6dZWTgaQzuU17R8` is committed in source and bundled:

- `src/pages/PlaceItemDetails.tsx:298` — raw hardcoded key, no env fallback
- `src/pages/FoodRestaurantDetails.tsx:265` — `VITE_GOOGLE_MAPS_EMBED_KEY || "AIza…"`
- `src/pages/AccommodationItemDetails.tsx:287` — `VITE_GOOGLE_MAPS_EMBED_KEY || "AIza…"`

This also fails on `master`. Contradicts `CHECKLIST.md` item #4 ("API key not
in frontend bundle"). **Owner decision needed** — options:

1. Remove the hardcoded fallbacks and require `VITE_GOOGLE_MAPS_EMBED_KEY`
   (green CI, but map embeds break anywhere the env var is unset).
2. Restrict the key by HTTP referrer in Google Cloud and relax the CI gate
   (Embed keys are inherently client-visible by design).
3. Route map embeds through the existing backend places proxy.

Recommended: **rotate the key** (it is public in git history) and adopt
option 1 or 2. Not fixed here — out of scope for a test fix and changes
runtime behavior.
