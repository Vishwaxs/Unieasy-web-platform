# Autonomous Deep-Work Run Log

Rolling log of one small, buildable improvement per run. Newest entry on top.

---

## 2026-07-05 — Fix Rules-of-Hooks violation in MerchantAuth

**Change:** `src/pages/MerchantAuth.tsx`

- Moved the `touched` `useState` (and its `markTouched` helper) above the
  early `return null` guard (`if (isSignedIn && role === "merchant")`). It was
  previously declared *after* that conditional return, so a signed-in merchant
  rendered the component with a different number of hooks than other users —
  a React Rules-of-Hooks violation (`react-hooks/rules-of-hooks`) that can
  trigger "Rendered fewer hooks than expected" runtime crashes and state
  corruption.
- Fixed an adjacent `no-useless-escape` lint error in the phone-number regex
  (`/[\s\-]/` → `/[\s-]/`) in the same validation block.

**Result:** `MerchantAuth.tsx` went from 3 ESLint errors to 0.

**Commands run:**
- `npx tsc --noEmit` → clean (exit 0)
- `npx eslint src/pages/MerchantAuth.tsx` → clean (exit 0)
- `npx vite build` → success (exit 0)
- `npx vitest run` → 4 passed, 1 failed. The single failure is a **pre-existing,
  unrelated** test in `src/__tests__/useSyncUser.test.tsx` (Supabase upsert
  payload assertion); it does not touch `MerchantAuth`. CI runs vitest with
  `|| true`, so it is non-blocking.

**Ready:** MerchantAuth page no longer risks a hooks-order crash; file is lint-clean.

**Next smallest step:** Investigate the pre-existing failure in
`src/__tests__/useSyncUser.test.tsx` (`calls supabase upsert with correct
payload when signed in`) — the assertion at line 50 expects a payload the hook
no longer produces; reconcile the test with the current `useSyncUser` upsert
shape. Other remaining lint errors worth clearing next: `no-explicit-any` in
`usePlaceDetail.ts` and `MerchantDashboard.tsx`, and the `require()` import in
`tailwind.config.ts`.
