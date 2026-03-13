-- 014_superadmin_columns.sql
-- Phase 6: Add is_suspended and last_active_at to app_users

ALTER TABLE app_users
  ADD COLUMN IF NOT EXISTS is_suspended BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS last_active_at TIMESTAMPTZ;
