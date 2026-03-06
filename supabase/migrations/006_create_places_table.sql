-- ============================================================================
-- 006_create_places_table.sql
-- UniEasy — Unified places table for all campus/off-campus listings.
-- All statements are idempotent (safe to re-run).
-- ============================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ═══════════════════════════════════════════════════════════════════════════════
-- PLACES TABLE
-- Drop any pre-existing table with wrong schema, then recreate.
-- Safe during initial setup. Remove DROP after first successful run.
-- ═══════════════════════════════════════════════════════════════════════════════

DROP TABLE IF EXISTS places CASCADE;

CREATE TABLE places (
  id                 UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
  name               TEXT          NOT NULL,
  google_place_id    TEXT          UNIQUE,
  category           TEXT          NOT NULL,
  type               TEXT          NOT NULL,
  address            TEXT,
  city               TEXT          DEFAULT 'Bangalore',
  lat                NUMERIC(10,7) NOT NULL,
  lng                NUMERIC(10,7) NOT NULL,
  phone              TEXT,
  website            TEXT,
  is_on_campus       BOOLEAN       NOT NULL DEFAULT false,
  is_static          BOOLEAN       NOT NULL DEFAULT true,
  is_manual_override BOOLEAN       NOT NULL DEFAULT false,
  data_source        TEXT          DEFAULT 'google_places_seed',
  last_fetched_at    TIMESTAMPTZ,
  rating             NUMERIC(2,1)  CHECK (rating >= 0 AND rating <= 5),
  rating_count       INTEGER       CHECK (rating_count >= 0),
  price_level        SMALLINT      CHECK (price_level BETWEEN 0 AND 4),
  photo_refs         JSONB         DEFAULT '[]',
  extra              JSONB         DEFAULT '{}',
  created_at         TIMESTAMPTZ   NOT NULL DEFAULT now(),
  updated_at         TIMESTAMPTZ   NOT NULL DEFAULT now(),

  -- Category must be one of the 13 canonical slugs
  CONSTRAINT chk_places_category CHECK (
    category IN (
      'food', 'accommodation', 'study', 'health', 'fitness', 'services',
      'transport', 'campus', 'essentials', 'hangout', 'safety', 'events', 'marketplace'
    )
  )
);

-- ═══════════════════════════════════════════════════════════════════════════════
-- INDEXES
-- ═══════════════════════════════════════════════════════════════════════════════

-- Unique index for upsert conflict target
CREATE UNIQUE INDEX IF NOT EXISTS idx_places_google_place_id
  ON places(google_place_id);

-- Category filter queries
CREATE INDEX IF NOT EXISTS idx_places_category
  ON places(category);

-- On/off campus split queries
CREATE INDEX IF NOT EXISTS idx_places_is_on_campus
  ON places(is_on_campus);

-- Composite for filtered list pages
CREATE INDEX IF NOT EXISTS idx_places_category_type
  ON places(category, type);

-- Spatial index: BTREE fallback on (lat, lng).
-- If PostGIS is enabled, replace this with:
--   CREATE INDEX IF NOT EXISTS idx_places_geography
--     ON places USING GIST (ST_MakePoint(lng, lat)::geography);
-- PostGIS GIST index provides true spatial queries (radius, bounding box).
-- The BTREE index below only supports exact-match and range queries on lat/lng.
CREATE INDEX IF NOT EXISTS idx_places_latng
  ON places(lat, lng);

-- ═══════════════════════════════════════════════════════════════════════════════
-- TRIGGER: auto-update places.updated_at on every UPDATE
-- ═══════════════════════════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION update_places_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_places_updated_at ON places;
CREATE TRIGGER trg_places_updated_at
  BEFORE UPDATE ON places
  FOR EACH ROW
  EXECUTE FUNCTION update_places_updated_at();

-- ============================================================================
-- DONE — Run in Supabase SQL Editor or via psql after migration 005.
-- ============================================================================
