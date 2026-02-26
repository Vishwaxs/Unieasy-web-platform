-- ============================================================================
-- 002_create_listings_tables.sql
-- UniEasy — Campus listing tables (food, accommodation, explore, study, essentials).
-- Idempotent (safe to re-run).
-- ============================================================================

-- ─── FOOD_ITEMS ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS food_items (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name       TEXT NOT NULL DEFAULT '',
  restaurant TEXT NOT NULL DEFAULT '',
  price      NUMERIC NOT NULL DEFAULT 0,
  rating     NUMERIC NOT NULL DEFAULT 0,
  reviews    INT NOT NULL DEFAULT 0,
  is_veg     BOOLEAN NOT NULL DEFAULT true,
  image      TEXT,
  comment    TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ─── ACCOMMODATIONS ─────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS accommodations (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name       TEXT NOT NULL DEFAULT '',
  type       TEXT NOT NULL DEFAULT '',
  price      NUMERIC NOT NULL DEFAULT 0,
  rating     NUMERIC NOT NULL DEFAULT 0,
  reviews    INT NOT NULL DEFAULT 0,
  distance   TEXT,
  amenities  TEXT[] DEFAULT '{}',
  image      TEXT,
  comment    TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ─── EXPLORE_PLACES ─────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS explore_places (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name       TEXT NOT NULL DEFAULT '',
  type       TEXT NOT NULL DEFAULT '',
  rating     NUMERIC NOT NULL DEFAULT 0,
  reviews    INT NOT NULL DEFAULT 0,
  distance   TEXT,
  timing     TEXT,
  crowd      TEXT,
  image      TEXT,
  comment    TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ─── STUDY_SPOTS ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS study_spots (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name       TEXT NOT NULL DEFAULT '',
  type       TEXT NOT NULL DEFAULT '',
  rating     NUMERIC NOT NULL DEFAULT 0,
  reviews    INT NOT NULL DEFAULT 0,
  distance   TEXT,
  timing     TEXT,
  noise      TEXT,
  has_wifi   BOOLEAN NOT NULL DEFAULT false,
  image      TEXT,
  comment    TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ─── ESSENTIALS ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS essentials (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name       TEXT NOT NULL DEFAULT '',
  category   TEXT NOT NULL DEFAULT '',
  rating     NUMERIC NOT NULL DEFAULT 0,
  reviews    INT NOT NULL DEFAULT 0,
  distance   TEXT,
  image      TEXT,
  comment    TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ─── CONTACT_MESSAGES ───────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS contact_messages (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name       TEXT NOT NULL DEFAULT '',
  email      TEXT NOT NULL DEFAULT '',
  phone      TEXT,
  subject    TEXT NOT NULL DEFAULT '',
  message    TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================================================
-- DONE — Run after 001, before 003.
-- ============================================================================
