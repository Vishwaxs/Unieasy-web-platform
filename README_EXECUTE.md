# README_EXECUTE.md — Step-by-Step Execution Guide

## Prerequisites

- **Node.js** ≥18 and npm
- **Python** 3.10+ and pip
- **Supabase** project with service role key
- **Google Cloud** project with **Places API (New)** enabled and API key
- Git access to the repo

## Important: `.env.local` (server-side only — never commit)

```bash
# server/.env.local
SUPABASE_URL=https://<your-supabase>.supabase.co
SUPABASE_ANON_KEY=eyJ...                           # frontend read-only
SUPABASE_SERVICE_ROLE_KEY=eyJ...                    # server-only, do NOT expose
GOOGLE_PLACES_API_KEY=AIza...                       # server-only
PORT=8080
```

```bash
# .env (frontend, safe to commit template)
VITE_SUPABASE_URL=https://<your-supabase>.supabase.co
VITE_SUPABASE_ANON_KEY=eyJ...
VITE_API_BASE_URL=http://localhost:8080
```

---

## 1) Apply Database Migrations

### Option A — Supabase SQL Editor (recommended)

1. Open **Supabase → SQL Editor**
2. Paste and run `supabase/migrations/006_create_places_table.sql`
3. Paste and run `supabase/migrations/007_places_rls_policies.sql`
4. Paste and run `supabase/migrations/008_cleanup_and_seed_all_categories.sql`

### Option B — psql CLI

```bash
export DATABASE_URL="postgresql://postgres:password@db.host:5432/postgres"
psql "$DATABASE_URL" -f supabase/migrations/006_create_places_table.sql
psql "$DATABASE_URL" -f supabase/migrations/007_places_rls_policies.sql
psql "$DATABASE_URL" -f supabase/migrations/008_cleanup_and_seed_all_categories.sql
```

### Verify

```sql
SELECT column_name FROM information_schema.columns WHERE table_name='places';
-- Expect 23 columns: id, name, google_place_id, category, type, address, city, lat, lng,
-- phone, website, is_on_campus, is_static, is_manual_override, data_source,
-- last_fetched_at, rating, rating_count, price_level, photo_refs, extra, created_at, updated_at

SELECT DISTINCT category FROM places ORDER BY category;
-- Expect: accommodation, campus, essentials, events, fitness, food, hangout,
-- health, marketplace, safety, services, study, transport
```

---

## 2) Install Dependencies

### Backend
```bash
cd server
npm install
```

### Frontend
```bash
cd ..   # back to repo root
npm install
```

### Seeder (Python)
```bash
pip install -r scripts/requirements.txt
```

---

## 3) Run the Seeder

### Dry run (no DB writes)
```bash
python scripts/seed_offcampus.py --dry-run --verbose --categories restaurant,cafe --location 12.9345,77.6069 --radius 2000
```

### Full seed (all categories, 3km radius)
```bash
python scripts/seed_offcampus.py --verbose --location 12.9345,77.6069 --radius 3000 --categories restaurant,cafe,gym,lodging,library,laundry,pharmacy,store
```

### Seeder output — expect:
- Number of results per category
- Upsert summary (inserted/updated/skipped)
- Any API errors with retry info

### Verify seeded rows
```sql
SELECT COUNT(*) FROM places WHERE data_source='google_places_seed';
SELECT id, name, google_place_id, category, rating FROM places WHERE category='food' LIMIT 5;
SELECT category, COUNT(*) FROM places GROUP BY category ORDER BY category;
```

---

## 4) Start Backend

```bash
cd server
npm run dev
```

Backend starts on `http://localhost:8080`.

### Test endpoints

```bash
# List places (food)
curl "http://localhost:8080/api/places?category=food&limit=10" | jq

# Single place detail (triggers live fetch if stale)
curl "http://localhost:8080/api/places/<UUID>" | jq

# Photo proxy
curl -I "http://localhost:8080/api/places/<UUID>/photo/0"
```

### Expected responses

- `GET /api/places` → `{ data: [...], count: N, offset: 0, limit: 10 }`
- `GET /api/places/:id` → Full place object with `live_fetch: true/false`
- `GET /api/places/:id/photo/0` → HTTP 200, `Content-Type: image/*`, `Cache-Control: public, max-age=604800`

---

## 5) Start Frontend

```bash
# from repo root
npm run dev
```

Open `http://localhost:5173` (or whatever Vite shows).

### Verify:
- Food page shows seeded restaurants with ratings
- Photos load via `/api/places/:id/photo/0` proxy
- Detail opens and shows live-updated rating if stale
- No API key visible in browser DevTools → Network

---

## 6) QA Checks & Verification

```sql
-- 1. No duplicate google_place_ids
SELECT google_place_id, COUNT(*) FROM places
WHERE google_place_id IS NOT NULL
GROUP BY google_place_id HAVING COUNT(*) > 1;
-- Expect: 0 rows

-- 2. All rows have coordinates
SELECT COUNT(*) FROM places WHERE lat IS NULL OR lng IS NULL;
-- Expect: 0

-- 3. On-campus skeletons intact
SELECT name, data_source FROM places WHERE is_on_campus = true ORDER BY category;

-- 4. Manual override protection
SELECT COUNT(*) FROM places WHERE is_manual_override = true;

-- 5. All 13 categories present
SELECT DISTINCT category FROM places ORDER BY category;
```

### API checks (with curl)
```bash
# 6. Details live fetch
curl "http://localhost:8080/api/places/<ID>" | jq '{name, rating, live_fetch, last_fetched_at}'

# 7. Photo proxy test
curl -I "http://localhost:8080/api/places/<ID>/photo/0"
# Expect 200 + Cache-Control header

# 8. No API key in frontend bundle
grep -r "GOOGLE" ./src/ -n
# Expect: 0 matches
```

---

## 7) Rollback Steps

### Remove seeded off-campus rows
```sql
DELETE FROM places WHERE data_source = 'google_places_seed';
```

### Remove manual skeleton rows
```sql
DELETE FROM places WHERE data_source = 'manual_skeleton';
```

### Rollback entire places table
```sql
DROP TABLE IF EXISTS places CASCADE;
```
Then re-run migrations from step 1.

---

## 8) Monitoring & Production Notes

- Put `GOOGLE_PLACES_API_KEY` in a secret manager for production
- Monitor Google Places API quota — set alerts for 429 error rate > 1%
- Consider a CRON job to refresh high-traffic places periodically
- Never expose `SUPABASE_SERVICE_ROLE_KEY` to the client

---

## 9) Example API Response

```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "name": "Third Wave Coffee",
  "google_place_id": "places/ChIJxxxxxx",
  "category": "food",
  "type": "cafe",
  "address": "SG Palya, Bangalore",
  "lat": 12.9345,
  "lng": 77.6069,
  "phone": "+91 80 1234 5678",
  "website": "https://thirdwave.in",
  "is_on_campus": false,
  "is_static": true,
  "data_source": "google_places_seed",
  "last_fetched_at": "2026-02-28T00:00:00.000Z",
  "rating": 4.2,
  "rating_count": 452,
  "photo_refs": [
    { "ref": "places/ChIJ.../photos/AUG...", "width": 1080, "height": 720, "html_attributions": ["Third Wave Coffee"] }
  ],
  "extra": {
    "opening_hours": { "openNow": true },
    "business_status": "OPERATIONAL",
    "reviews": [
      { "author": "Student A", "rating": 5, "text": "Great coffee!" }
    ]
  },
  "live_fetch": true
}
```

---

## 10) Final Acceptance

When all QA checks pass:
1. Commit all files
2. Create PR from feature branch → main
3. Run migrations in production Supabase SQL Editor
4. Seed production with `python scripts/seed_offcampus.py --verbose`
5. Deploy backend and frontend

---

## 11) Production Deployment

### 11.1 Deploy the Backend (Express server)

Recommended: **Railway** or **Render** (both support Node.js with zero config).

1. Connect your GitHub repo to Railway/Render.
2. Set **Root Directory** to: `server`
3. Set **Start Command** to: `npm start`
4. Set the following env vars in the platform dashboard (never commit real values):
   - `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `GOOGLE_PLACES_API_KEY`
   - `ALLOWED_ORIGIN` (set to your production frontend URL)
   - `PORT` (usually auto-set by the platform)
   - `SENTRY_DSN`, `NODE_ENV=production`
5. Note the deployed backend URL (e.g., `https://unieasy-api.up.railway.app`).

### 11.2 Deploy the Frontend (Vite app)

Recommended: **Vercel** (supports Vite natively with zero config).

1. Connect your GitHub repo to Vercel.
2. Set **Framework Preset** to: Vite
3. Set **Root Directory** to: `.` (repository root)
4. Set the following env vars in Vercel dashboard:
   - `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, `VITE_CLERK_PUBLISHABLE_KEY`
   - `VITE_API_BASE_URL` (set to the backend URL from step 11.1)
   - `VITE_SENTRY_DSN`

### 11.3 Run Supabase Migrations in Production

- **Option A (Supabase CLI):** `supabase db push --linked`
- **Option B (SQL editor):** Open Supabase dashboard → SQL editor → paste each file in `supabase/migrations/` in order (001 through 009).

### 11.4 Post-deploy Verification

```bash
curl https://your-backend-url.com/healthz        # expect { status: "ok", db: "connected" }
curl https://your-backend-url.com/api/places?category=food&limit=1  # expect { data: [...] }
```
Open `https://your-frontend-url.com` → confirm places list loads from backend.

### 11.5 Update Service Configurations After Deploy

- **Clerk dashboard:** add production frontend and backend domains to allowed origins
- **Google Cloud Console:** restrict API key to backend server IP (see PRODUCTION_PASS_REPORT.md)
- **ALLOWED_ORIGIN** in backend env: set to exact Vercel production URL

