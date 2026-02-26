-- ============================================================================
-- 001_create_app_users.sql
-- UniEasy — Core user table for Clerk-to-Supabase identity mapping.
-- Idempotent (safe to re-run).
-- ============================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE IF NOT EXISTS app_users (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  clerk_user_id   TEXT UNIQUE NOT NULL,
  email           TEXT NOT NULL DEFAULT '',
  full_name       TEXT NOT NULL DEFAULT '',
  role            TEXT NOT NULL DEFAULT 'student',
  role_updated_at TIMESTAMPTZ,
  created_at      TIMESTAMPTZ DEFAULT now()
);

-- Index for fast Clerk user lookups (used by every authenticated request)
CREATE INDEX IF NOT EXISTS idx_app_users_clerk_id ON app_users (clerk_user_id);

-- ============================================================================
-- DONE — Run before 002.
-- ============================================================================
