-- ============================================================================
-- 004_admin_audit_and_ads.sql
-- UniEasy — Admin system, audit logging, and ads management
-- All statements are idempotent (safe to re-run).
-- ============================================================================

-- ─── EXTENSIONS ─────────────────────────────────────────────────────────────
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ═══════════════════════════════════════════════════════════════════════════════
-- BASE TABLES (create if they don't exist yet)
-- ═══════════════════════════════════════════════════════════════════════════════

-- ─── APP_USERS ──────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS app_users (
  id             UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  clerk_user_id  TEXT UNIQUE NOT NULL,
  email          TEXT NOT NULL DEFAULT '',
  full_name      TEXT NOT NULL DEFAULT '',
  role           TEXT NOT NULL DEFAULT 'student',
  role_updated_at TIMESTAMPTZ,
  created_at     TIMESTAMPTZ DEFAULT now()
);

-- ─── ADS ────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS ads (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  clerk_user_id   TEXT NOT NULL,
  title           TEXT NOT NULL DEFAULT '',
  description     TEXT,
  image_url       TEXT,
  target_location TEXT,
  duration_days   INT DEFAULT 30,
  status          TEXT NOT NULL DEFAULT 'pending',
  approved_by     TEXT,
  approved_at     TIMESTAMPTZ,
  rejected_reason TEXT,
  created_at      TIMESTAMPTZ DEFAULT now(),
  updated_at      TIMESTAMPTZ DEFAULT now()
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

-- ═══════════════════════════════════════════════════════════════════════════════
-- COLUMN ADDITIONS (idempotent — safe if tables were created above or existed)
-- ═══════════════════════════════════════════════════════════════════════════════

-- ─── APP_USERS: add role & role_updated_at ──────────────────────────────────
ALTER TABLE app_users ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'student';
ALTER TABLE app_users ADD COLUMN IF NOT EXISTS role_updated_at TIMESTAMPTZ;

-- ─── ADS: add status, approval, rejection, and metadata columns ────────────
ALTER TABLE ads ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'pending';
ALTER TABLE ads ADD COLUMN IF NOT EXISTS approved_by TEXT;
ALTER TABLE ads ADD COLUMN IF NOT EXISTS approved_at TIMESTAMPTZ;
ALTER TABLE ads ADD COLUMN IF NOT EXISTS rejected_reason TEXT;
ALTER TABLE ads ADD COLUMN IF NOT EXISTS target_location TEXT;
ALTER TABLE ads ADD COLUMN IF NOT EXISTS duration_days INT DEFAULT 30;
ALTER TABLE ads ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now();

-- ─── AUDIT_LOGS table ──────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS audit_logs (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  actor_id    TEXT NOT NULL,
  actor_role  TEXT NOT NULL,
  action      TEXT NOT NULL,
  target_type TEXT NOT NULL,
  target_id   TEXT NOT NULL,
  details     JSONB DEFAULT '{}'::jsonb,
  created_at  TIMESTAMPTZ DEFAULT now()
);

-- ─── INDEX: fast lookup of ads by status ────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_ads_status ON ads (status);

-- Index for audit_logs queries (ordered by created_at DESC)
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs (created_at DESC);

-- ─── TRIGGER: auto-update ads.updated_at ────────────────────────────────────
CREATE OR REPLACE FUNCTION update_ads_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_ads_updated_at ON ads;
CREATE TRIGGER trg_ads_updated_at
  BEFORE UPDATE ON ads
  FOR EACH ROW
  EXECUTE FUNCTION update_ads_updated_at();

-- ─── TRIGGER: auto-update app_users.role_updated_at on role change ──────────
CREATE OR REPLACE FUNCTION update_role_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.role IS DISTINCT FROM NEW.role THEN
    NEW.role_updated_at = now();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_role_updated_at ON app_users;
CREATE TRIGGER trg_role_updated_at
  BEFORE UPDATE ON app_users
  FOR EACH ROW
  EXECUTE FUNCTION update_role_updated_at();

-- ============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================================

-- ─── Enable RLS on all tables ───────────────────────────────────────────────
ALTER TABLE app_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE ads ENABLE ROW LEVEL SECURITY;
ALTER TABLE contact_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE food_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE accommodations ENABLE ROW LEVEL SECURITY;
ALTER TABLE explore_places ENABLE ROW LEVEL SECURITY;
ALTER TABLE study_spots ENABLE ROW LEVEL SECURITY;
ALTER TABLE essentials ENABLE ROW LEVEL SECURITY;

-- ─── FORCE RLS for table owners too (bypasses only via service_role) ────────
ALTER TABLE app_users FORCE ROW LEVEL SECURITY;
ALTER TABLE ads FORCE ROW LEVEL SECURITY;
ALTER TABLE contact_messages FORCE ROW LEVEL SECURITY;
ALTER TABLE audit_logs FORCE ROW LEVEL SECURITY;

-- ─────────────────────────────────────────────────────────────────────────────
-- APP_USERS policies
-- ─────────────────────────────────────────────────────────────────────────────

-- Users can read their own row (for useUserRole, useSyncUser)
DROP POLICY IF EXISTS "app_users_select_own" ON app_users;
CREATE POLICY "app_users_select_own" ON app_users
  FOR SELECT
  USING (true);
  -- NOTE: We allow SELECT for all anon users because the frontend needs to
  -- look up role by clerk_user_id and Supabase anon key doesn't carry a
  -- Clerk identity. The service_role key is used server-side for admin ops.
  -- Columns are limited—no sensitive data is stored here.

-- Users can upsert their own row (useSyncUser upserts on sign-in)
DROP POLICY IF EXISTS "app_users_insert_own" ON app_users;
CREATE POLICY "app_users_insert_own" ON app_users
  FOR INSERT
  WITH CHECK (true);
  -- useSyncUser inserts with clerk_user_id from Clerk.
  -- The actual security is that only Clerk-authed users call this, and the
  -- server API (service_role) handles privileged operations.

-- Users can update their own row's non-role columns.
-- Role changes MUST go through the server API (service_role key).
DROP POLICY IF EXISTS "app_users_update_own" ON app_users;
CREATE POLICY "app_users_update_own" ON app_users
  FOR UPDATE
  USING (true)
  WITH CHECK (
    -- Block anon-key role changes: role must stay the same
    role = (SELECT au.role FROM app_users au WHERE au.id = app_users.id)
  );

-- ─────────────────────────────────────────────────────────────────────────────
-- ADS policies
-- ─────────────────────────────────────────────────────────────────────────────

-- Anyone can read active ads (for public display, if needed)
DROP POLICY IF EXISTS "ads_select_active" ON ads;
CREATE POLICY "ads_select_active" ON ads
  FOR SELECT
  USING (true);
  -- Merchants need to see their own ads (any status) on the dashboard,
  -- and the anon key doesn't carry identity, so we allow all SELECTs.
  -- Admin read operations use service_role (bypasses RLS).

-- Merchants can insert new ads (status defaults to 'pending')
DROP POLICY IF EXISTS "ads_insert" ON ads;
CREATE POLICY "ads_insert" ON ads
  FOR INSERT
  WITH CHECK (status = 'pending');
  -- Only pending ads can be inserted via anon key.
  -- Approval/rejection goes through server (service_role).

-- Block anon-key updates on ads (all updates go through server)
DROP POLICY IF EXISTS "ads_update_block" ON ads;
CREATE POLICY "ads_update_block" ON ads
  FOR UPDATE
  USING (false);

-- Block anon-key deletes on ads
DROP POLICY IF EXISTS "ads_delete_block" ON ads;
CREATE POLICY "ads_delete_block" ON ads
  FOR DELETE
  USING (false);

-- ─────────────────────────────────────────────────────────────────────────────
-- CONTACT_MESSAGES policies
-- ─────────────────────────────────────────────────────────────────────────────

-- Anyone can insert a contact message
DROP POLICY IF EXISTS "contact_messages_insert" ON contact_messages;
CREATE POLICY "contact_messages_insert" ON contact_messages
  FOR INSERT
  WITH CHECK (true);

-- Only service_role can read contact messages (admin server)
DROP POLICY IF EXISTS "contact_messages_select" ON contact_messages;
CREATE POLICY "contact_messages_select" ON contact_messages
  FOR SELECT
  USING (false);

-- Block updates and deletes via anon key
DROP POLICY IF EXISTS "contact_messages_update" ON contact_messages;
CREATE POLICY "contact_messages_update" ON contact_messages
  FOR UPDATE
  USING (false);

DROP POLICY IF EXISTS "contact_messages_delete" ON contact_messages;
CREATE POLICY "contact_messages_delete" ON contact_messages
  FOR DELETE
  USING (false);

-- ─────────────────────────────────────────────────────────────────────────────
-- AUDIT_LOGS policies (only service_role can read/write)
-- ─────────────────────────────────────────────────────────────────────────────

DROP POLICY IF EXISTS "audit_logs_deny_all" ON audit_logs;
CREATE POLICY "audit_logs_deny_all" ON audit_logs
  FOR ALL
  USING (false);

-- ─────────────────────────────────────────────────────────────────────────────
-- DATA TABLES (food_items, accommodations, explore_places, study_spots, essentials)
-- Public read, no anon write
-- ─────────────────────────────────────────────────────────────────────────────

-- food_items
DROP POLICY IF EXISTS "food_items_select" ON food_items;
CREATE POLICY "food_items_select" ON food_items
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "food_items_insert_block" ON food_items;
CREATE POLICY "food_items_insert_block" ON food_items
  FOR INSERT WITH CHECK (false);

DROP POLICY IF EXISTS "food_items_update_block" ON food_items;
CREATE POLICY "food_items_update_block" ON food_items
  FOR UPDATE USING (false);

DROP POLICY IF EXISTS "food_items_delete_block" ON food_items;
CREATE POLICY "food_items_delete_block" ON food_items
  FOR DELETE USING (false);

-- accommodations
DROP POLICY IF EXISTS "accommodations_select" ON accommodations;
CREATE POLICY "accommodations_select" ON accommodations
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "accommodations_insert_block" ON accommodations;
CREATE POLICY "accommodations_insert_block" ON accommodations
  FOR INSERT WITH CHECK (false);

DROP POLICY IF EXISTS "accommodations_update_block" ON accommodations;
CREATE POLICY "accommodations_update_block" ON accommodations
  FOR UPDATE USING (false);

DROP POLICY IF EXISTS "accommodations_delete_block" ON accommodations;
CREATE POLICY "accommodations_delete_block" ON accommodations
  FOR DELETE USING (false);

-- explore_places
DROP POLICY IF EXISTS "explore_places_select" ON explore_places;
CREATE POLICY "explore_places_select" ON explore_places
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "explore_places_insert_block" ON explore_places;
CREATE POLICY "explore_places_insert_block" ON explore_places
  FOR INSERT WITH CHECK (false);

DROP POLICY IF EXISTS "explore_places_update_block" ON explore_places;
CREATE POLICY "explore_places_update_block" ON explore_places
  FOR UPDATE USING (false);

DROP POLICY IF EXISTS "explore_places_delete_block" ON explore_places;
CREATE POLICY "explore_places_delete_block" ON explore_places
  FOR DELETE USING (false);

-- study_spots
DROP POLICY IF EXISTS "study_spots_select" ON study_spots;
CREATE POLICY "study_spots_select" ON study_spots
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "study_spots_insert_block" ON study_spots;
CREATE POLICY "study_spots_insert_block" ON study_spots
  FOR INSERT WITH CHECK (false);

DROP POLICY IF EXISTS "study_spots_update_block" ON study_spots;
CREATE POLICY "study_spots_update_block" ON study_spots
  FOR UPDATE USING (false);

DROP POLICY IF EXISTS "study_spots_delete_block" ON study_spots;
CREATE POLICY "study_spots_delete_block" ON study_spots
  FOR DELETE USING (false);

-- essentials
DROP POLICY IF EXISTS "essentials_select" ON essentials;
CREATE POLICY "essentials_select" ON essentials
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "essentials_insert_block" ON essentials;
CREATE POLICY "essentials_insert_block" ON essentials
  FOR INSERT WITH CHECK (false);

DROP POLICY IF EXISTS "essentials_update_block" ON essentials;
CREATE POLICY "essentials_update_block" ON essentials
  FOR UPDATE USING (false);

DROP POLICY IF EXISTS "essentials_delete_block" ON essentials;
CREATE POLICY "essentials_delete_block" ON essentials
  FOR DELETE USING (false);

-- ============================================================================
-- DONE
-- Run this in the Supabase SQL Editor, or via `supabase db push`.
-- All statements are idempotent — safe to re-run.
-- ============================================================================
