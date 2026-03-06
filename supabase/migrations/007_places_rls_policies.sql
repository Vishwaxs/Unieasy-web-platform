-- ============================================================================
-- 007_places_rls_policies.sql
-- UniEasy — Row Level Security policies for the places table.
-- Idempotent (safe to re-run).
-- ============================================================================

-- ─── Enable RLS ─────────────────────────────────────────────────────────────
ALTER TABLE places ENABLE ROW LEVEL SECURITY;

-- ─── Public read access (anon role) ─────────────────────────────────────────
DROP POLICY IF EXISTS "Public read places" ON places;
CREATE POLICY "Public read places" ON places
  FOR SELECT
  USING (true);

-- ─── Service role write access (seeder and backend) ─────────────────────────
-- service_role bypasses RLS by default in Supabase, but we add an explicit
-- policy for clarity and documentation purposes.
DROP POLICY IF EXISTS "Service role write places" ON places;
CREATE POLICY "Service role write places" ON places
  FOR ALL
  USING (auth.role() = 'service_role');

-- ─── Block anon-key inserts ─────────────────────────────────────────────────
DROP POLICY IF EXISTS "places_insert_block" ON places;
CREATE POLICY "places_insert_block" ON places
  FOR INSERT
  WITH CHECK (false);

-- ─── Block anon-key updates ────────────────────────────────────────────────
DROP POLICY IF EXISTS "places_update_block" ON places;
CREATE POLICY "places_update_block" ON places
  FOR UPDATE
  USING (false);

-- ─── Block anon-key deletes ────────────────────────────────────────────────
DROP POLICY IF EXISTS "places_delete_block" ON places;
CREATE POLICY "places_delete_block" ON places
  FOR DELETE
  USING (false);

-- ============================================================================
-- NOTE: Ads table RLS is already configured in migrations 004 and 005.
-- No changes to ads RLS policies are made here.
-- ============================================================================
