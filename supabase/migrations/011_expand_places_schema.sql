-- ============================================================================
-- 011_expand_places_schema.sql
-- Phase 2: Expand places table with new columns for data integrity fixes.
-- Idempotent (safe to re-run).
-- ============================================================================

-- ── New columns on places ───────────────────────────────────────────────────
ALTER TABLE places
  ADD COLUMN IF NOT EXISTS sub_type          TEXT,
  ADD COLUMN IF NOT EXISTS is_veg            BOOLEAN,
  ADD COLUMN IF NOT EXISTS price_inr         NUMERIC,
  ADD COLUMN IF NOT EXISTS price_range_min   NUMERIC,
  ADD COLUMN IF NOT EXISTS price_range_max   NUMERIC,
  ADD COLUMN IF NOT EXISTS cuisine_tags      TEXT[],
  ADD COLUMN IF NOT EXISTS amenities         TEXT[],
  ADD COLUMN IF NOT EXISTS waiting_time_mins INTEGER,
  ADD COLUMN IF NOT EXISTS noise_level       TEXT
                            CHECK (noise_level IN ('quiet','moderate','loud')),
  ADD COLUMN IF NOT EXISTS has_wifi          BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS timing            TEXT,
  ADD COLUMN IF NOT EXISTS distance_from_campus TEXT,
  ADD COLUMN IF NOT EXISTS crowd_level       TEXT
                            CHECK (crowd_level IN ('low','moderate','high')),
  ADD COLUMN IF NOT EXISTS business_status   TEXT,
  ADD COLUMN IF NOT EXISTS is_open_now       BOOLEAN,
  ADD COLUMN IF NOT EXISTS verified          BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS display_price_label TEXT;

-- ── Extend category constraint to include 'oncampus' ────────────────────────
ALTER TABLE places DROP CONSTRAINT IF EXISTS chk_places_category;
ALTER TABLE places ADD CONSTRAINT chk_places_category CHECK (
  category IN (
    'food', 'accommodation', 'study', 'health', 'fitness', 'services',
    'transport', 'campus', 'essentials', 'hangout', 'safety', 'events',
    'marketplace', 'oncampus'
  )
);

-- ── Composite index for category + sub_type queries ─────────────────────────
CREATE INDEX IF NOT EXISTS idx_places_cat_subtype
  ON places(category, sub_type);

-- ============================================================================
-- DONE
-- ============================================================================
