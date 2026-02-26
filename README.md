# UniEasy — Campus Discovery App

> **Christ University Central Campus** — discover food, accommodation, study spots, and more.

## Tech Stack

| Layer     | Technology                              |
| --------- | --------------------------------------- |
| Frontend  | Vite + React 18 + TypeScript            |
| Styling   | Tailwind CSS + shadcn/ui                |
| Auth      | Clerk                                   |
| Backend   | Node.js + Express                       |
| Database  | Supabase (Postgres) + Supabase Storage  |
| Logging   | Pino (server) + Sentry (optional)       |

## Quick Start

### Prerequisites

- **Node.js** ≥ 18 LTS
- **npm** ≥ 9
- A [Supabase](https://supabase.com) project
- A [Clerk](https://clerk.com) application

### 1. Clone & Install

```sh
git clone <your-repo-url>
cd unieasy-explorer-hub-3c530f4e

# Frontend
npm install

# Server
cd server && npm install && cd ..
```

### 2. Set Up Environment

```sh
# Frontend — copy template and fill in your values
cp .env.template .env.local

# Server — copy template and fill in your values
cp server/.env.template server/.env.local
```

> ⚠️ **Never commit `.env.local`** — it is in `.gitignore`. See the `.env.template` files for required variables.

### 3. Apply Migrations

Run migrations in order against your Supabase database:

```sh
# Using psql (replace $DATABASE_URL with your connection string)
psql "$DATABASE_URL" -f supabase/migrations/001_create_app_users.sql
psql "$DATABASE_URL" -f supabase/migrations/002_create_listings_tables.sql
psql "$DATABASE_URL" -f supabase/migrations/003_seed_data.sql
psql "$DATABASE_URL" -f supabase/migrations/004_admin_audit_and_ads.sql
psql "$DATABASE_URL" -f supabase/migrations/005_rls_tighten_ads.sql
```

Or use the **Supabase SQL Editor** to paste and run each file.

### 4. Create Storage Bucket

In Supabase Dashboard → Storage, create a bucket named **`ads-images`** (set to public for development).

### 5. Run

```sh
# Terminal 1: Start server (http://localhost:8080)
cd server && node index.js

# Terminal 2: Start frontend (http://localhost:5173)
npm run dev
```

### 6. Verify

```sh
# TypeScript
npx tsc --noEmit

# Build
npx vite build

# Unit tests
npx vitest run --reporter=verbose

# Env & migration check
node scripts/verify-env.js

# Health endpoints (with server running)
curl http://localhost:8080/healthz
curl http://localhost:8080/readyz
```

## Scripts

| Command             | Description                             |
| ------------------- | --------------------------------------- |
| `npm run dev`       | Start Vite dev server                   |
| `npm run build`     | Production build                        |
| `npm run preview`   | Preview production build                |
| `npm run lint`      | Run ESLint                              |
| `npm run test`      | Run Vitest                              |

## Project Structure

```
├── src/                  # React frontend
│   ├── components/       # UI components (shadcn/ui)
│   ├── hooks/            # Custom hooks (useSyncUser, useUserRole, etc.)
│   ├── lib/              # Utilities (adminApi, supabase client)
│   └── pages/            # Route pages
├── server/               # Express backend
│   ├── lib/              # Server utilities (supabaseAdmin, logger, sentry)
│   ├── middleware/        # Auth middleware (verifyClerkToken)
│   └── tests/            # RLS smoke tests
├── supabase/
│   └── migrations/       # SQL migrations (001-005)
├── scripts/              # Dev utilities (verify-env)
└── .github/workflows/    # CI pipeline
```

## Key Architecture Decisions

- **`useSyncUser`** upserts the user into `app_users` on sign-in but **never overwrites the `role` column**. Role changes are only made through the admin API.
- **Service role key** is used server-side only. Frontend uses the anon key.
- **RLS policies** enforce data access at the database level.

## Migrations

All migrations are idempotent (safe to re-run):

1. `001_create_app_users.sql` — User identity table
2. `002_create_listings_tables.sql` — Campus listing tables
3. `003_seed_data.sql` — Example seed data
4. `004_admin_audit_and_ads.sql` — Ads, audit logs, RLS policies
5. `005_rls_tighten_ads.sql` — Restrict ad visibility to active only

## Acceptance Checklist

- [ ] Migrations 001-005 applied
- [ ] `ads-images` bucket exists
- [ ] Frontend runs on `http://localhost:5173`
- [ ] Server runs on `http://localhost:8080`
- [ ] `npx tsc --noEmit` — zero errors
- [ ] `npx vite build` — success
- [ ] `node scripts/verify-env.js` — OK
- [ ] Health endpoints return 200
