-- ═══════════════════════════════════════════════════════════════════════════════
-- Notifications table for UniEasy in-app notifications
-- Run this once in your Supabase SQL Editor (or as a migration).
-- ═══════════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS notifications (
  id            uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  clerk_user_id text NOT NULL,
  type          text NOT NULL,          -- e.g. 'ad_approved', 'merchant_upgrade_approved'
  title         text NOT NULL,
  body          text NOT NULL DEFAULT '',
  link          text,                   -- frontend route to navigate to on click
  meta          jsonb DEFAULT '{}'::jsonb,
  is_read       boolean DEFAULT false,
  created_at    timestamptz DEFAULT now()
);

-- Index for fast queries by user (unread first, newest first)
CREATE INDEX IF NOT EXISTS idx_notifications_user
  ON notifications (clerk_user_id, is_read, created_at DESC);

-- Row-Level Security
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Users can read their own notifications
CREATE POLICY "Users can view own notifications"
  ON notifications FOR SELECT
  USING (clerk_user_id = current_setting('request.jwt.claims', true)::json->>'sub');

-- Service role (backend) can insert notifications for any user
-- (No INSERT policy needed when using supabaseAdmin with service_role key)

-- Users can update (mark as read) their own notifications
CREATE POLICY "Users can update own notifications"
  ON notifications FOR UPDATE
  USING (clerk_user_id = current_setting('request.jwt.claims', true)::json->>'sub');
