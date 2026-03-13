-- ── 012_reviews_interactions.sql ─────────────────────────────────────────────
-- Phase 3: Reviews, Reactions, Sentiment Polls, Community Chat

-- ═══════════════════════════════════════════════════════════════════════════════
-- 1. REVIEWS TABLE
-- ═══════════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS reviews (
  id                UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  place_id          UUID        NOT NULL REFERENCES places(id) ON DELETE CASCADE,
  clerk_user_id     TEXT        NOT NULL REFERENCES app_users(clerk_user_id),
  rating            SMALLINT    NOT NULL CHECK (rating BETWEEN 1 AND 5),
  body              TEXT        NOT NULL CHECK (char_length(body) >= 10 AND char_length(body) <= 1000),
  is_anonymous      BOOLEAN     NOT NULL DEFAULT false,
  verified_student  BOOLEAN     NOT NULL DEFAULT false,
  status            TEXT        NOT NULL DEFAULT 'active'
                    CHECK (status IN ('active','flagged','deleted_by_user','deleted_by_admin')),
  deleted_at        TIMESTAMPTZ,
  deleted_by        TEXT,
  helpful_count     INTEGER     NOT NULL DEFAULT 0,
  not_helpful_count INTEGER     NOT NULL DEFAULT 0,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (place_id, clerk_user_id)
);

CREATE INDEX IF NOT EXISTS idx_reviews_place   ON reviews(place_id);
CREATE INDEX IF NOT EXISTS idx_reviews_user    ON reviews(clerk_user_id);
CREATE INDEX IF NOT EXISTS idx_reviews_status  ON reviews(status);
CREATE INDEX IF NOT EXISTS idx_reviews_created ON reviews(created_at DESC);

-- Trigger: auto-update updated_at
CREATE OR REPLACE FUNCTION update_reviews_updated_at()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_reviews_updated_at
  BEFORE UPDATE ON reviews
  FOR EACH ROW EXECUTE FUNCTION update_reviews_updated_at();

-- RLS
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;

CREATE POLICY "reviews_select_active" ON reviews
  FOR SELECT USING (status = 'active');

CREATE POLICY "reviews_insert_student" ON reviews
  FOR INSERT WITH CHECK (true);

CREATE POLICY "reviews_update_own" ON reviews
  FOR UPDATE USING (true);

CREATE POLICY "reviews_delete_own" ON reviews
  FOR DELETE USING (true);

-- Aggregate columns on places
ALTER TABLE places
  ADD COLUMN IF NOT EXISTS review_count    INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS avg_review      NUMERIC(2,1) NOT NULL DEFAULT 0;

-- ═══════════════════════════════════════════════════════════════════════════════
-- 2. USER REACTIONS TABLE (likes, dislikes, bookmarks)
-- ═══════════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS user_reactions (
  id            UUID  PRIMARY KEY DEFAULT gen_random_uuid(),
  clerk_user_id TEXT  NOT NULL REFERENCES app_users(clerk_user_id),
  place_id      UUID  NOT NULL REFERENCES places(id) ON DELETE CASCADE,
  reaction      TEXT  NOT NULL CHECK (reaction IN ('like','dislike','bookmark')),
  created_at    TIMESTAMPTZ DEFAULT now(),
  UNIQUE (clerk_user_id, place_id, reaction)
);

CREATE INDEX IF NOT EXISTS idx_reactions_place    ON user_reactions(place_id);
CREATE INDEX IF NOT EXISTS idx_reactions_user     ON user_reactions(clerk_user_id);
CREATE INDEX IF NOT EXISTS idx_reactions_reaction ON user_reactions(reaction);

ALTER TABLE user_reactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "reactions_select_own" ON user_reactions
  FOR SELECT USING (true);
CREATE POLICY "reactions_insert" ON user_reactions
  FOR INSERT WITH CHECK (true);
CREATE POLICY "reactions_delete" ON user_reactions
  FOR DELETE USING (true);

-- Aggregate counts on places
ALTER TABLE places
  ADD COLUMN IF NOT EXISTS like_count     INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS dislike_count  INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS bookmark_count INTEGER NOT NULL DEFAULT 0;

-- ═══════════════════════════════════════════════════════════════════════════════
-- 3. SENTIMENT POLLS TABLE
-- ═══════════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS sentiment_polls (
  id            UUID  PRIMARY KEY DEFAULT gen_random_uuid(),
  place_id      UUID  NOT NULL REFERENCES places(id) ON DELETE CASCADE,
  clerk_user_id TEXT  NOT NULL REFERENCES app_users(clerk_user_id),
  sentiment     TEXT  NOT NULL CHECK (sentiment IN (
    'love', 'like', 'neutral', 'dislike', 'terrible'
  )),
  created_at    TIMESTAMPTZ DEFAULT now(),
  UNIQUE (place_id, clerk_user_id)
);

CREATE INDEX IF NOT EXISTS idx_poll_place ON sentiment_polls(place_id);
CREATE INDEX IF NOT EXISTS idx_poll_user  ON sentiment_polls(clerk_user_id);

ALTER TABLE sentiment_polls ENABLE ROW LEVEL SECURITY;

CREATE POLICY "poll_select"  ON sentiment_polls FOR SELECT USING (true);
CREATE POLICY "poll_insert"  ON sentiment_polls FOR INSERT WITH CHECK (true);
CREATE POLICY "poll_update"  ON sentiment_polls FOR UPDATE USING (true);

-- Aggregate columns on places
ALTER TABLE places
  ADD COLUMN IF NOT EXISTS sentiment_love     INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS sentiment_like     INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS sentiment_neutral  INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS sentiment_dislike  INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS sentiment_terrible INTEGER NOT NULL DEFAULT 0;

-- ═══════════════════════════════════════════════════════════════════════════════
-- 4. COMMUNITY MESSAGES TABLE
-- ═══════════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS community_messages (
  id            UUID  PRIMARY KEY DEFAULT gen_random_uuid(),
  clerk_user_id TEXT  NOT NULL REFERENCES app_users(clerk_user_id),
  message       TEXT  NOT NULL CHECK (char_length(message) >= 1 AND char_length(message) <= 500),
  is_deleted    BOOLEAN NOT NULL DEFAULT false,
  deleted_by    TEXT,
  created_at    TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_community_created ON community_messages(created_at DESC);

ALTER TABLE community_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "chat_select_active" ON community_messages
  FOR SELECT USING (is_deleted = false);
CREATE POLICY "chat_insert_student" ON community_messages
  FOR INSERT WITH CHECK (true);

-- Add verified_student flag to app_users if not present
ALTER TABLE app_users
  ADD COLUMN IF NOT EXISTS verified_student BOOLEAN NOT NULL DEFAULT false;
