# CHECKLIST.md — Safety & QA Verification

## Data Integrity

- [ ] **1. Coordinates present** — Every seeded place has non-null `lat` and `lng`
  ```sql
  SELECT COUNT(*) FROM places WHERE lat IS NULL OR lng IS NULL;
  -- Must be: 0
  ```

- [ ] **2. No duplicate google_place_id** — Upserts are idempotent
  ```sql
  SELECT google_place_id, COUNT(*) FROM places
  WHERE google_place_id IS NOT NULL
  GROUP BY google_place_id HAVING COUNT(*) > 1;
  -- Must be: 0 rows
  ```

- [ ] **3. All 13 categories present**
  ```sql
  SELECT DISTINCT category FROM places ORDER BY category;
  -- Must show: accommodation, campus, essentials, events, fitness, food,
  -- hangout, health, marketplace, safety, services, study, transport
  ```

## Security

- [ ] **4. API key not in frontend bundle**
  ```bash
  grep -r "GOOGLE" ./src/ -n
  grep -r "AIza" ./src/ -n
  # Must be: 0 matches
  ```

- [ ] **5. .env.local not committed**
  ```bash
  git ls-files server/.env.local
  # Must be: empty (not tracked)
  ```

## TTL Behavior

- [ ] **6. TTL enforced on live fetch** — Defaults match these values:
  | Field | TTL |
  |---|---|
  | name/address/coords | 30 days |
  | rating | 6 hours |
  | opening_hours/open_now | 15 minutes |
  | reviews | 24 hours |
  | photo_refs | 30 days |

  **Test:** Set `last_fetched_at` to 7 hours ago, call `GET /places/:id`, verify `live_fetch: true`

- [ ] **7. last_fetched_at updates** — After a live fetch, `last_fetched_at` is set to now
  ```bash
  curl "http://localhost:8080/api/places/<ID>" | jq '.last_fetched_at'
  ```

## Manual Override Protection

- [ ] **8. On-campus rows protected** — Seeder and live fetch skip rows where `is_on_campus=true AND is_manual_override=true`
  ```sql
  SELECT name, data_source, is_manual_override FROM places
  WHERE is_on_campus = true AND is_manual_override = true;
  -- These rows must not change after re-running the seeder
  ```

## Photo Proxy

- [ ] **9. Photo proxy returns image** — Backend streams Google photo without exposing API key
  ```bash
  curl -I "http://localhost:8080/api/places/<ID>/photo/0"
  # Must return:
  #   HTTP 200
  #   Content-Type: image/jpeg (or image/png)
  #   Cache-Control: public, max-age=604800
  #   X-Photo-Attribution: [...]
  ```

## End-to-End

- [ ] **10. Frontend loads data from backend** — Open browser DevTools → Network:
  - List page fetches `GET /api/places?category=food`
  - Images load from `/api/places/:id/photo/0` (not from Google directly)
  - No requests to `maps.googleapis.com` or `places.googleapis.com` from frontend
  - All Google API calls originate from `localhost:8080` (backend)

## Rollback Commands

```sql
-- Remove Google-seeded rows
DELETE FROM places WHERE data_source = 'google_places_seed';

-- Remove manual skeletons
DELETE FROM places WHERE data_source = 'manual_skeleton';

-- Full table rollback
DROP TABLE IF EXISTS places CASCADE;
```

## Photo Caching — Legal Note

> **⚠️ Google Terms of Service:** Place photos may not be cached for more than 30 days. If `CACHE_PHOTOS_TO_STORAGE=true` is enabled, you must implement automated cleanup of expired images and always display `html_attributions` alongside cached photos. Reference: [Google Places Data Policies](https://developers.google.com/maps/documentation/places/web-service/policies).
