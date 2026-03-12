-- ============================================================================
-- 010_phase1_profile_and_merchant_requests.sql
-- Phase 1: Add profile fields to app_users + create merchant_upgrade_requests
-- Idempotent (safe to re-run).
-- ============================================================================

-- ── Extend app_users with profile fields ────────────────────────────────────
ALTER TABLE app_users
  ADD COLUMN IF NOT EXISTS phone TEXT,
  ADD COLUMN IF NOT EXISTS student_id TEXT,
  ADD COLUMN IF NOT EXISTS programme TEXT,
  ADD COLUMN IF NOT EXISTS year_of_study TEXT,
  ADD COLUMN IF NOT EXISTS bio TEXT,
  ADD COLUMN IF NOT EXISTS avatar_url TEXT;

-- ── Merchant upgrade requests ───────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS merchant_upgrade_requests (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clerk_user_id   TEXT NOT NULL REFERENCES app_users(clerk_user_id),
  business_name   TEXT NOT NULL,
  business_type   TEXT NOT NULL,
  contact_number  TEXT,
  description     TEXT,
  status          TEXT NOT NULL DEFAULT 'pending'
                  CHECK (status IN ('pending','approved','rejected')),
  reviewed_by     TEXT,
  review_note     TEXT,
  created_at      TIMESTAMPTZ DEFAULT now(),
  updated_at      TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_merchant_requests_status
  ON merchant_upgrade_requests(status);
CREATE INDEX IF NOT EXISTS idx_merchant_requests_clerk
  ON merchant_upgrade_requests(clerk_user_id);

-- ============================================================================
-- DONE
-- ============================================================================
