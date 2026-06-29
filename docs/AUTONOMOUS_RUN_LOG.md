# Autonomous Run Log

A rolling log of small, buildable improvements made by the autonomous deep-work routine.
Newest entries on top.

---

## 2026-06-29 — Fix Rules-of-Hooks violation in MerchantAuth

**Problem:** `src/pages/MerchantAuth.tsx` called `useState` for the `touched`
state *after* an early `return null` (`if (isSignedIn && role === "merchant")`).
React requires hooks to run in the same order on every render; when `role`
transitioned to `"merchant"` the hook count changed, which throws
"Rendered fewer hooks than expected" and crashes the page. ESLint flagged it as
`react-hooks/rules-of-hooks`.

**Change:** Moved the `touched` `useState` (and its `markTouched` helper) up with
the other top-level hooks, before the conditional return. Also fixed an
unnecessary escape (`/[\s\-]/` → `/[\s-]/`, `no-useless-escape`) in the same file.

**Files changed:** `src/pages/MerchantAuth.tsx`

**Verification:**
- `npx tsc --noEmit` → exit 0
- `npx eslint src/pages/MerchantAuth.tsx` → 0 errors, 0 warnings (was 2 errors)
- `npx vite build` → built successfully

**Notes / next smallest step:** A pre-existing, unrelated test failure remains in
`src/__tests__/useSyncUser.test.tsx` (an `upsert` argument-shape assertion). The
remaining repo-wide lint issues are 7 errors (mostly `@typescript-eslint/no-explicit-any`
in `MerchantDashboard.tsx`, `usePlaceDetail.ts`, and a `require()` import in
`tailwind.config.ts`) plus a few `react-hooks/exhaustive-deps` warnings — each a
good candidate for a future single-change run.
