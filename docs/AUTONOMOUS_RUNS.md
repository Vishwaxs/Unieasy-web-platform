# Autonomous run log

A rolling log of small, self-contained improvements made by scheduled
deep-work runs. Newest entry first.

## 2026-08-06 — Extract shared places helper (`src/lib/places.ts`)

**Change:** The four category "places" hooks — `useFoodItems`,
`useAccommodations`, `useStudySpots`, `useEssentials` — each carried a
byte-for-byte identical copy of the `API_BASE` constant and the `getPhotoUrl`
helper. Extracted both into a single `src/lib/places.ts` and updated the hooks
to import from it. Removed the now-dead `shortAddress` import from
`useAccommodations`, `useStudySpots`, and `useEssentials` (it was imported but
unused in all three). Added `src/__tests__/places.test.ts` covering
`getPhotoUrl`'s fallback and photo-proxy branches.

**Files changed:**
- `src/lib/places.ts` (new)
- `src/__tests__/places.test.ts` (new)
- `src/hooks/useFoodItems.ts`
- `src/hooks/useAccommodations.ts`
- `src/hooks/useStudySpots.ts`
- `src/hooks/useEssentials.ts`

**Verification (Node 22):**
- `npx tsc --noEmit` → clean
- `npx eslint <changed files>` → clean (0 problems)
- `npx vitest run src/__tests__/places.test.ts` → 4 passed
- `npm run build` → success
- Full `npx vitest run` → 8 passed / 1 failed; the one failure is the
  pre-existing `useSyncUser.test.tsx` stale-assertion (`last_active_at`),
  unrelated to this change and already fixed in open PRs #22 / #24.

**Next smallest step:** `useExplorePlaces.ts` has a near-identical (but not
byte-identical) `getPhotoUrl` variant plus its own `API_BASE`; a follow-up
could reconcile it against `src/lib/places.ts` once the differences are
confirmed safe to unify. Separately, the standing repo-wide blocker remains an
owner merge decision — `master` has not moved since 2026-03-20 and many
verified PRs are queued behind PR #7 (leaked-key fix).
