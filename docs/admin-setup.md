# Admin & Super-Admin System — Setup Guide

## 1  Environment variables

### Frontend (`/.env`)

```dotenv
VITE_SUPABASE_URL=https://<project>.supabase.co
VITE_SUPABASE_ANON_KEY=<anon-key>
VITE_CLERK_PUBLISHABLE_KEY=pk_live_…
VITE_API_BASE_URL=http://localhost:8080
```

### Server (`/server/.env.local`)

```dotenv
SUPABASE_URL=https://<project>.supabase.co
SUPABASE_ANON_KEY=<anon-key>
SUPABASE_SERVICE_ROLE_KEY=<service-role-key>
CLERK_SECRET_KEY=sk_live_…
PORT=8080
ALLOWED_ORIGINS=http://localhost:5173

# Optional — structured error tracking
SENTRY_DSN=https://<key>@o<org>.ingest.sentry.io/<project>

# Optional — email notifications
SMTP_HOST=smtp.gmail.com
SMTP_USER=you@gmail.com
SMTP_PASS=app-password
ADMIN_NOTIFICATION_EMAIL=admin@unieasy.com

# Optional — log level (debug | info | warn | error)
LOG_LEVEL=info
```

> **Never** commit `.env` or `server/.env.local` to version control.

---

## 2  Run the SQL migrations

Open the Supabase SQL Editor and run these files **in order**:

1. `supabase/migrations/004_admin_audit_and_ads.sql` — base tables, columns, triggers, indexes, RLS
2. `supabase/migrations/005_rls_tighten_ads.sql` — tightens ads SELECT to `status = 'active'` only

Both are **idempotent** — safe to run more than once.

### What they create / modify

| Object | Change |
|--------|--------|
| `app_users` | Adds `role` (default `'student'`), `role_updated_at` columns |
| `ads` | Adds `status`, `approved_by`, `approved_at`, `rejected_reason`, `target_location`, `duration_days`, `updated_at` |
| `audit_logs` | New table — tracks every admin action |
| `contact_messages` | Insert-only via anon key; reads require service_role |
| Indexes | `idx_ads_status` on `ads(status)`, `idx_audit_logs_created_at` |
| Triggers | auto-update `updated_at` on `ads`, auto-update `role_updated_at` on `app_users` |
| RLS | Enabled + FORCE on sensitive tables; anon key sees only active ads |

---

## 3  Install dependencies

```bash
# Frontend
npm install

# Server
cd server
npm install
```

### Key server dependencies

| Package | Purpose |
|---------|---------|
| `express` | HTTP server |
| `helmet` | Security headers |
| `express-rate-limit` | API rate limiting (100 req / 15 min) |
| `cors` | CORS with allowed-origins whitelist |
| `multer` | Multipart image upload (5 MB max) |
| `pino` + `pino-pretty` | Structured logging |
| `@sentry/node` | Error tracking (optional, needs SENTRY_DSN) |
| `@clerk/express` | JWT verification |
| `@supabase/supabase-js` | DB access (service_role) |
| `nodemailer` | Admin email notifications |

---

## 4  Start the server

```bash
cd server
node index.js
# → UniEasy Server running on http://localhost:8080
```

Health check: `GET http://localhost:8080/api/health`

---

## 5  Promote yourself to super-admin

```sql
UPDATE app_users
SET    role = 'superadmin'
WHERE  clerk_user_id = '<your-clerk-user-id>';
```

---

## 6  Role hierarchy

| Role | Can do |
|------|--------|
| `student` | Default. Normal app access |
| `merchant` | Submit ads (via server upload), manage own listings |
| `admin` | Review & approve/reject pending ads |
| `superadmin` | Everything admin can do **plus** change user roles, view audit logs |

---

## 7  API endpoints

### Admin routes (`/api/admin`)

| Method | Path | Required role | Description |
|--------|------|---------------|-------------|
| GET | `/ads/pending` | admin, superadmin | List ads with `status = 'pending'` |
| POST | `/ads/:id/approve` | admin, superadmin | Set ad to `active` |
| POST | `/ads/:id/reject` | admin, superadmin | Set ad to `rejected` (body: `{ reason }`) |
| GET | `/users` | superadmin | List all app users |
| POST | `/users/role` | superadmin | Change role (body: `{ clerkUserId, newRole }`) |
| GET | `/audit-logs` | superadmin | Last 100 audit entries |
| POST | `/notify-new-ad` | any authed | Trigger admin notification for a new ad |

### Merchant routes (`/api/merchant`)

| Method | Path | Required role | Description |
|--------|------|---------------|-------------|
| POST | `/upgrade` | any authed (student) | Self-upgrade to merchant |
| POST | `/ads/upload` | merchant | Upload ad image (multipart, field: `image`, max 5 MB) → `{ imageUrl }` |
| POST | `/ads` | merchant | Create ad (body: `{ title, description?, imageUrl, targetLocation, durationDays }`) |
| GET | `/ads` | merchant | List own ads (all statuses) |

### Other

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/health` | Health check |

---

## 8  Frontend routes

| Path | Component | Access |
|------|-----------|--------|
| `/admin` | `AdminDashboard` | admin, superadmin |
| `/superadmin` | `SuperAdminDashboard` | superadmin only |
| `/merchant` | `MerchantAuth` | any signed-in user |
| `/merchant/dashboard` | `MerchantDashboard` | merchant |

All protected routes are wrapped in `<ProtectedRoute allowed={[…]}>`.

---

## 9  RLS smoke tests

Run against a live Supabase instance:

```bash
cd server
node --test tests/rls-smoke.test.js
```

Verifies:
- Anon key can only SELECT active ads (not pending/rejected)
- Anon key cannot INSERT ads with `status != 'pending'`
- Anon key cannot UPDATE or DELETE ads
- Audit logs are fully blocked for anon key
- Data tables (food_items, accommodations, etc.) are read-only for anon

---

## 10  CI / CD

GitHub Actions workflow at `.github/workflows/ci.yml`:
- Runs on push / PR to `master` / `main`
- Matrix: Node 18 + 20
- Steps: `npm ci` → `tsc --noEmit` → `eslint` → `vite build` → `vitest run`

---

## 11  Manual test plan

1. **Sign in** as a regular student → verify `/admin` shows "Access Denied".
2. **Promote** yourself to `superadmin` using the SQL above.
3. **Reload** the app → navigate to `/superadmin` → user list should load.
4. **Create** a test merchant account → go to `/merchant/dashboard` → upload an image → submit an ad.
5. Navigate to `/admin` → the pending ad should appear.
6. **Approve** the ad → toast confirms, ad disappears from pending list.
7. **Reject** another ad with a reason → verify the reason is stored.
8. In `/superadmin`, change a user's role → verify the role column updates.
9. Check `audit_logs` in Supabase → every approve/reject/role-change should have an entry.

---

## 12  Files reference

### Created

| File | Purpose |
|------|---------|
| `supabase/migrations/004_admin_audit_and_ads.sql` | Base schema + RLS |
| `supabase/migrations/005_rls_tighten_ads.sql` | Tightened ads SELECT policy |
| `server/index.js` | Express entry point (helmet, rate-limit, CORS, logging, Sentry) |
| `server/adminRoutes.js` | Admin API router |
| `server/merchantRoutes.js` | Merchant API router (upgrade, upload, ads CRUD) |
| `server/middleware/verifyClerkToken.js` | Clerk JWT + role middleware |
| `server/lib/supabaseAdmin.js` | Service-role Supabase client |
| `server/lib/logger.js` | Pino structured logger |
| `server/lib/sentry.js` | Sentry initialisation (no-op without DSN) |
| `server/lib/notifyAdmins.js` | Admin notification helper |
| `server/tests/rls-smoke.test.js` | RLS smoke tests |
| `src/lib/adminApi.ts` | Shared API helpers (adminFetch, apiFetch, named methods) |
| `src/pages/AdminDashboard.tsx` | Pending-ads review UI |
| `src/pages/SuperAdminDashboard.tsx` | User role management UI |
| `src/hooks/useRoleRefresh.ts` | Re-fetch role on window focus |
| `.github/workflows/ci.yml` | CI pipeline |
| `docs/admin-setup.md` | This file |

### Modified

| File | Change |
|------|--------|
| `src/pages/MerchantAuth.tsx` | Uses server API (`apiFetch`) for merchant upgrade |
| `src/pages/MerchantDashboard.tsx` | Uses server endpoints for image upload + ad creation (no direct Supabase) |
| `src/components/ProtectedRoute.tsx` | Added `allowed` prop + `useRoleRefresh` |
| `src/App.tsx` | Added admin/superadmin/merchant routes |
| All 5 data hooks | Migrated from useState/useEffect to React Query `useQuery` |
