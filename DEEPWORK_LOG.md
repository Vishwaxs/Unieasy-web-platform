# Deep-Work Run Log

Autonomous improvement log. Each entry = one small, buildable change.

## 2026-06-28

**Change:** Fixed a failing unit test in `src/__tests__/useSyncUser.test.tsx`.

- The test asserted the exact Supabase `upsert` payload with `toHaveBeenCalledWith`,
  but the `useSyncUser` hook legitimately also sends a `last_active_at` timestamp.
  The strict equality made the test fail on every run.
- Reworked the assertion to use `expect.objectContaining(...)` for the stable
  fields and to validate that `last_active_at` is a parseable ISO-8601 string,
  rather than pinning an unstable timestamp value.

**Verification:**
- `npx vitest run` → 2 files, 5 tests, all passing (was 1 failing).
- `npx eslint src/__tests__/useSyncUser.test.tsx` → clean.

**State:** Test suite is green.

**Next smallest step:** `src/lib/reviewStats.ts` (pure rating math + compact-count
formatting with NaN/edge-case guards) has no test coverage — add a focused
`reviewStats.test.ts` covering `getAverageEmoji`, `computeCombinedReviewStats`,
and `formatCompactCount`.
