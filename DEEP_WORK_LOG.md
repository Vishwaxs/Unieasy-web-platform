# Deep-Work Autonomous Run Log

Rolling log of one-small-change-per-run improvements. Newest entry first.

---

## 2026-07-08 — Fix stale `useSyncUser` test (red → green suite)

**Problem:** `npx vitest run` failed 1/5 tests. `src/__tests__/useSyncUser.test.tsx`
asserted the Supabase upsert payload as an exact object without `last_active_at`,
but `useSyncUser` writes `last_active_at: new Date().toISOString()` on every sync.
The column was added in migration `014_superadmin_columns.sql` and is read by the
Admin/SuperAdmin dashboards and server routes — so the hook is correct and the test
was stale (written before last-active tracking existed).

**Change:** Updated the exact-match assertion to include
`last_active_at: expect.any(String)` (timestamp is non-deterministic), with a comment
explaining the field. Hook behavior left unchanged.

**Files changed:**
- `src/__tests__/useSyncUser.test.tsx`

**Commands run:**
- `npx vitest run` → 5 passed (2 files) ✓
- `npx tsc --noEmit` → exit 0 ✓
- `npx eslint src/__tests__/useSyncUser.test.tsx` → exit 0 ✓
- `npx vite build` → built ✓

**Ready:** Frontend test suite is green; CI frontend gate (tsc/lint/build/vitest) passes locally.

**Next smallest step:** CI runs vitest with `|| true`, masking failures. Remove that
suppression (make `Frontend tests` fail the build) now the suite is green — do it once
a couple more flaky/stale tests are confirmed stable, to avoid a red master.
