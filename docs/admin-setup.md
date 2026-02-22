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
GOOGLE_PLACES_API_KEY=<key>          # optional
PORT=8080

# Optional — for email notifications
SMTP_HOST=smtp.gmail.com
SMTP_USER=you@gmail.com
SMTP_PASS=app-password
ADMIN_NOTIFICATION_EMAIL=admin@unieasy.com
```

> **Never** commit `.env` or `server/.env.local` to version control.

---

## 2  Run the SQL migration

Open the Supabase SQL Editor and paste `supabase/migrations/004_admin_audit_and_ads.sql`, then click **Run**.

The migration is **idempotent** — safe to run more than once.

It creates / modifies:

| Object | Change |
|--------|--------|
| `app_users` | Adds `role` (default `'student'`), `role_updated_at` columns |
| `ads` | Adds `status`, `approved_by`, `approved_at`, `rejected_reason`, `target_location`, `duration_days`, `updated_at` columns |
| `audit_logs` | New table — tracks every admin action |
| Indexes | `idx_ads_status` on `ads(status)` |
| Triggers | auto-update `updated_at` on `ads`, auto-update `role_updated_at` on `app_users` |

---

## 3  Install server dependencies

```bash
cd server
npm init -y          # only the first time
npm install express cors dotenv @clerk/clerk-sdk-node @supabase/supabase-js
npm install nodemailer  # optional, for email notifications
```

---

## 4  Start the server

```bash
cd server
node index.js
# → Server running on http://localhost:8080
```

You should see the health check at `http://localhost:8080/api/health`.

---

## 5  Promote yourself to super-admin

Run this in the Supabase SQL Editor (replace `<your-clerk-user-id>` with the value from your Clerk dashboard → Users):

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
| `merchant` | Submit ads, manage own listings |
| `admin` | Review & approve/reject pending ads |
| `superadmin` | Everything admin can do **plus** change user roles, view audit logs |

---

## 7  API endpoints (all under `/api/admin`)

| Method | Path | Required role | Description |
|--------|------|---------------|-------------|
| GET | `/ads/pending` | admin, superadmin | List ads with `status = 'pending'` |
| POST | `/ads/:id/approve` | admin, superadmin | Set ad to `active` |
| POST | `/ads/:id/reject` | admin, superadmin | Set ad to `rejected` (body: `{ reason }`) |
| GET | `/users` | superadmin | List all app users |
| POST | `/users/role` | superadmin | Change role (body: `{ clerkUserId, newRole }`) |
| GET | `/audit-logs` | superadmin | Last 100 audit entries |
| POST | `/notify-new-ad` | any authed | Trigger admin notification for a new ad |

---

## 8  Frontend routes

| Path | Component | Access |
|------|-----------|--------|
| `/admin` | `AdminDashboard` | admin, superadmin |
| `/superadmin` | `SuperAdminDashboard` | superadmin only |

Both routes are wrapped in `<ProtectedRoute allowed={[…]}>`.

---

## 9  Manual test plan

1. **Sign in** as a regular student → verify `/admin` shows "Access Denied".
2. **Promote** yourself to `superadmin` using the SQL above.
3. **Reload** the app → navigate to `/superadmin` → user list should load.
4. **Create** a test merchant account and submit an ad (or insert one via SQL with `status = 'pending'`).
5. Navigate to `/admin` → the pending ad should appear.
6. **Approve** the ad → toast confirms, ad disappears from pending list.
7. **Reject** another ad with a reason → verify the reason is stored.
8. In `/superadmin`, change a user's role → verify the role column updates in the table.
9. Check `audit_logs` in Supabase → every approve/reject/role-change should have an entry.

---

## 10  Files reference

### Created

| File | Purpose |
|------|---------|
| `supabase/migrations/004_admin_audit_and_ads.sql` | DB schema for admin system |
| `server/index.js` | Express entry point |
| `server/adminRoutes.js` | Admin API router |
| `server/middleware/verifyClerkToken.js` | Clerk JWT + role middleware |
| `server/lib/supabaseAdmin.js` | Service-role Supabase client |
| `server/lib/notifyAdmins.js` | Admin notification helper |
| `src/pages/AdminDashboard.tsx` | Pending-ads review UI |
| `src/pages/SuperAdminDashboard.tsx` | User role management UI |
| `src/hooks/useRoleRefresh.ts` | Re-fetch role on window focus |
| `docs/admin-setup.md` | This file |

### Modified

| File | Change |
|------|--------|
| `src/components/ProtectedRoute.tsx` | Added `allowed` prop for role-based access |
| `src/App.tsx` | Added `/admin` and `/superadmin` routes |
