-- ── 013_ads_impression_count.sql ─────────────────────────────────────────────
-- Phase 5: Add impression tracking to ads table

ALTER TABLE ads ADD COLUMN IF NOT EXISTS impression_count INTEGER NOT NULL DEFAULT 0;
