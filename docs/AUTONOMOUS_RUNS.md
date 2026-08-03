# Autonomous Deep-Work Run Log

A rolling log of small, buildable improvements made by the autonomous deep-work
routine. Newest entry on top. Each run makes **one** meaningful change.

---

## 2026-08-03 — Fix Rules of Hooks violation in MerchantAuth

**Change:** `src/pages/MerchantAuth.tsx`

`useState(touched)` was declared *after* the `if (isSignedIn && role === "merchant") return null;`
early return. When a merchant-role user landed on this page, the component returned
before that hook ran, changing the hook call order between renders — a Rules of Hooks
violation that can crash the component with "Rendered fewer hooks than expected."

- Hoisted the `touched` state (and its `markTouched` helper) above the early return,
  next to the other `useState` declarations.
- Removed a stray `\-` escape in the phone-cleanup regex character class (`/[\s-]/`),
  clearing the file's remaining `no-useless-escape` error.

**Verification:**
- `npx eslint src/pages/MerchantAuth.tsx` → clean (0 problems).
- `npm run build` → success.
- `npx vitest run` → unchanged vs. baseline (4 passed, 1 pre-existing unrelated failure).
- Repo-wide lint: 9 → 7 errors.

**Ready:** MerchantAuth page is hook-safe and lint-clean.

**CI note:** `frontend-ci` is red on this PR (and on `master`) due to a **pre-existing**
failure unrelated to this change — see next step. `tsc --noEmit`, `vite build`, and
`verify-migrations` all pass.

**Next smallest step (highest priority — security):** `frontend-ci`'s key-leak gate
(`grep -r "AIza" dist/`) fails because a live Google Maps Embed API key
(`AIzaSy…`) is hardcoded in three files and bundled into the client:
`src/pages/PlaceItemDetails.tsx:298` (raw literal),
`src/pages/FoodRestaurantDetails.tsx:265` and
`src/pages/AccommodationItemDetails.tsx:287` (both `... || "AIzaSy…"` fallbacks).
Proper fix (its own PR): **rotate + domain-restrict the key in Google Cloud** (the
existing one is already in git history), then remove all three literals in favor of
`import.meta.env.VITE_GOOGLE_MAPS_EMBED_KEY`, failing gracefully when it's absent.

**Other follow-ups:** the pre-existing failing test `src/__tests__/useSyncUser.test.tsx`
(mock `upsert` assertion mismatch); and 7 remaining lint errors, mostly
`@typescript-eslint/no-explicit-any` in `MerchantDashboard.tsx` / `superadmin` pages
and a `require()` import in `tailwind.config.ts`, each fixable in isolation.
