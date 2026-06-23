# Autonomous Run Log

State summary and next action for deep-work autonomous runs. Newest entry first.

## 2026-06-23

**Change:** Fixed the stale assertion in `src/__tests__/useSyncUser.test.tsx`.
The `useSyncUser` hook writes a `last_active_at` timestamp into the Supabase
upsert payload, but the test still asserted an exact payload without that field,
so the suite had one failing test. Updated the assertion to expect
`last_active_at: expect.any(String)`.

**Files changed:** `src/__tests__/useSyncUser.test.tsx`

**Commands run:**
- `npm run build` → success (pre-existing chunk-size warning only)
- `npm test` → 5 passed / 5 (was 4 passed, 1 failed before)
- `npm run lint` → 9 errors, 16 warnings (all pre-existing, unrelated to this change)

**Now ready:** Test suite is green again.

**CI note (PR #4):** The `frontend-ci` GitHub Actions job is RED, but the cause
is pre-existing and repo-wide, not from this PR. It fails at the "Key leak
check" step: a hardcoded Google Maps Embed key (`AIzaSyBFw0…`) is baked into the
bundle from `src/pages/{PlaceItemDetails,FoodRestaurantDetails,AccommodationItemDetails}.tsx`.
`master` fails identically. Surfaced to the maintainer in a PR comment for a
decision (rotate key + drop hardcoded literal in favor of
`VITE_GOOGLE_MAPS_EMBED_KEY`, and/or narrow the over-broad `grep "AIza"` gate
since a Maps Embed key is legitimately client-side). Not auto-fixed: ambiguous,
security-sensitive, and needs key rotation + Vercel env verification.

**Next smallest step:** Clear ESLint errors one file at a time. Lowest-risk
first: `tailwind.config.ts:110` (`@typescript-eslint/no-require-imports`) and
`MerchantAuth.tsx:101` (`no-useless-escape`). The `react-hooks/rules-of-hooks`
error in `MerchantAuth.tsx:107` (conditional `useState`) is a genuine bug worth
fixing carefully in its own run.
