-- ============================================================================
-- 005_rls_tighten_ads.sql
-- Tighten ads SELECT policy: anon key can only read active (approved) ads.
-- Merchant "my ads" and admin operations go through the server (service_role).
-- Idempotent — safe to re-run.
-- ============================================================================

-- Replace the permissive "select all" policy with one restricted to active ads.
DROP POLICY IF EXISTS "ads_select_active" ON ads;
CREATE POLICY "ads_select_active" ON ads
  FOR SELECT
  USING (status = 'active');
  -- Only approved/active ads are visible through the anon key.
  -- Merchants fetch their own ads via server endpoint (service_role bypasses RLS).
  -- Admins read pending ads via server endpoint (service_role bypass).

-- ============================================================================
-- DONE — Run in Supabase SQL Editor after 004.
-- ============================================================================
