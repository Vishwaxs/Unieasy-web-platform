# Autonomous Run Summary

## 2026-08-07 — Fix Rules of Hooks violation in MerchantAuth

### What changed
- `src/pages/MerchantAuth.tsx`: Hoisted the `touched` state (`useState`) and its
  `markTouched` helper to sit alongside the other form-field state, above the
  early `return null` guard (`if (isSignedIn && role === "merchant")`).

### Why
The `useState` for `touched` was declared **after** a conditional early return.
When `role === "merchant"`, the component returned before reaching that hook, so
the number of hooks called differed between renders. React's Rules of Hooks
require hooks to run in the same order on every render; violating this crashes
the MerchantAuth page ("Rendered fewer hooks than expected"). This is the
recurring "Rules of Hooks violation in MerchantAuth" issue re-discovered across
many prior unmerged PRs (#26, #20, #17, #16, #11, #10, #6, ...).

### Verification
- `npm install` — 516 packages, OK
- `npm run build` — ✅ built in ~20s, exit 0
- `npx eslint src/pages/MerchantAuth.tsx` with `react-hooks/rules-of-hooks` — no
  violations (previously flagged)
- `npx vitest run src/__tests__/useSyncUser.test.tsx` — 3 passed, 1 failed

### Known pre-existing issues (NOT touched — out of scope for this change)
- `useSyncUser.test.tsx`: 1 stale assertion failing because the test omits the
  `last_active_at` field the hook now sends. Recurring across many prior PRs;
  unrelated to this file.
- `MerchantAuth.tsx` line ~113: a `no-useless-escape` lint error on the
  `/[\s\-]/` regex predates this change (my edit only shifted its line number).

### Next smallest step
Fix the stale `useSyncUser.test.tsx` assertion to include `last_active_at` in the
expected upsert payload — a one-line change that restores a green test suite.
