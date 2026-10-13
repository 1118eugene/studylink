ALTER TABLE users
  ADD COLUMN IF NOT EXISTS program TEXT,
  ADD COLUMN IF NOT EXISTS is_suspended BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS profile_visibility TEXT NOT NULL DEFAULT 'members'
    CHECK (profile_visibility IN ('members', 'private')),
  ADD COLUMN IF NOT EXISTS notification_preferences JSONB NOT NULL
    DEFAULT '{"groups":true,"sessions":true,"moderation":true}'::jsonb;

ALTER TABLE study_groups
  ADD COLUMN IF NOT EXISTS capacity INTEGER CHECK (capacity IS NULL OR capacity >= 2),
  ADD COLUMN IF NOT EXISTS join_type TEXT NOT NULL DEFAULT 'open'
    CHECK (join_type IN ('open', 'closed'));

ALTER TABLE resources
  ADD COLUMN IF NOT EXISTS source_note TEXT,
  ADD COLUMN IF NOT EXISTS course_code TEXT;

CREATE TABLE IF NOT EXISTS notifications (
  id BIGSERIAL PRIMARY KEY,
  user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('groups', 'sessions', 'moderation')),
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  read_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_notifications_user_created_at
  ON notifications(user_id, created_at DESC);
