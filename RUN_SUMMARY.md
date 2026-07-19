# Run Summary — 2026-07-19

**Note:** Requested branch `claude/stoic-pascal-d0zch2` does not exist in this
repo (no branch, no PR, no matching commit). Verified instead against the
most recent real overnight-run branch/PR: `claude/sweet-galileo-qegg1t` (PR #16).

## What's ready
- Single commit on top of `master`: hoists a `useState` above an early
  `return null` in `src/pages/MerchantAuth.tsx`, fixing a genuine React
  rules-of-hooks crash. `tsc --noEmit`, `eslint` on the file, and `vite build`
  all pass clean.

## What's broken (pre-existing, not caused by this branch)
- `src/__tests__/useSyncUser.test.tsx` fails (`last_active_at` field missing
  from the exact-match assertion) — confirmed this also fails identically on
  `master`, so it predates this change and is out of scope here.
- CI's key-leak grep (`AIza` in `dist/`) still trips — a hardcoded Google Maps
  key baked into three detail pages, pre-existing on `master`.
- **Meta-issue**: 15 open draft PRs (#3–#16) from this recurring job, none
  merged. Several duplicate the same two fixes (MerchantAuth hooks bug,
  useSyncUser test) independently because master never advances.

## This pass
Verified build/typecheck/lint/tests on `claude/sweet-galileo-qegg1t`. No new
regression found, so no code fix made — only this summary added.

## Next smallest step
Merge one of the redundant MerchantAuth-fix PRs (e.g. #16) into `master` so
the recurring job stops re-discovering the same fix, then close its duplicates.
