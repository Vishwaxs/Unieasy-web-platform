# Autonomous Run Log

Rolling log of small, buildable improvements made by autonomous deep-work runs.
Newest entry first.

---

## 2026-07-04 — Eliminate remaining `any` / empty-object-type ESLint errors

**Change:** Removed 4 TypeScript type-safety ESLint errors (`@typescript-eslint/no-explicit-any`,
`@typescript-eslint/no-empty-object-type`) without altering runtime behavior.

**Files changed:**
- `src/hooks/usePlaceDetail.ts` — `extra: Record<string, any>` → `Record<string, unknown>`.
- `src/components/ui/textarea.tsx` — empty `interface TextareaProps extends …` → `type TextareaProps = …` alias.
- `src/pages/MerchantDashboard.tsx` — `catch (err: any)` → `catch (err: unknown)` with an
  `instanceof Error` narrowing; `setActiveTab(v as any)` → `v as typeof activeTab`.

**Verification:**
- `npx tsc --noEmit` → exit 0
- `npx eslint .` → **5 errors** (was 9) / 16 warnings
- `npx vite build` → built successfully (pre-existing chunk-size warning only)

**CI outcome (PR #9):** `verify-migrations` ✅, `backend-ci` ✅. `frontend-ci` steps for this
diff all pass (`tsc` ✅, `eslint` ✅, `vite build` ✅) but the **job is red at the pre-existing
`Key leak check` step** — a hardcoded `AIzaSy…` Maps key on `master` (in `PlaceItemDetails.tsx`,
`FoodRestaurantDetails.tsx`, `AccommodationItemDetails.tsx`) lands in `dist/`. This blocks
`frontend-ci` on *every* PR cut from `master`. Fix already exists in open **PR #7** (unmerged).

**Scope note:** Deliberately did not touch issues already covered by other open draft PRs:
- useSyncUser test assertion (PRs #3, #4, #5, #8)
- Google Maps key leak + reviewStats tests (PR #7)
- MerchantAuth hooks-order bug + no-useless-escape (PR #6)

**Next smallest step:** The last remaining lint error not owned by an open PR is
`tailwind.config.ts:110` (`@typescript-eslint/no-require-imports`) — convert the
`require("tailwindcss-animate")` plugin import to an ESM `import`. After that, the
`react-hooks/exhaustive-deps` warnings in `AdminDashboard.tsx` (wrap `fetchLogs` in
`useCallback`) are the next low-risk polish.
