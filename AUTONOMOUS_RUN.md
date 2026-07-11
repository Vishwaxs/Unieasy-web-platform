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
