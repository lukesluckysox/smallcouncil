-- ─────────────────────────────────────────────────────────────────────────────
-- Small Council — SQLite Schema
-- Runs automatically via instrumentation.ts on every server start.
-- All statements use IF NOT EXISTS / CREATE OR REPLACE — fully idempotent.
-- ─────────────────────────────────────────────────────────────────────────────

-- ─── Users ───────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS users (
  id            TEXT PRIMARY KEY,
  email         TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  created_at    TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  updated_at    TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);

CREATE INDEX IF NOT EXISTS idx_users_email ON users (email);

-- ─── Auth Sessions ────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS auth_sessions (
  id          TEXT PRIMARY KEY,
  user_id     TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token       TEXT UNIQUE NOT NULL,
  expires_at  TEXT NOT NULL,
  created_at  TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);

CREATE INDEX IF NOT EXISTS idx_auth_sessions_token   ON auth_sessions (token);
CREATE INDEX IF NOT EXISTS idx_auth_sessions_user_id ON auth_sessions (user_id);

-- ─── Council Sessions ─────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS sessions (
  id              TEXT PRIMARY KEY,
  user_id         TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title           TEXT,
  dilemma         TEXT NOT NULL,
  council_summary TEXT,
  ruling          TEXT,
  status          TEXT NOT NULL DEFAULT 'active',
  created_at      TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  updated_at      TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);

CREATE INDEX IF NOT EXISTS idx_sessions_user_id_created
  ON sessions (user_id, created_at DESC);

-- ─── Council Turns ────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS council_turns (
  id                TEXT PRIMARY KEY,
  session_id        TEXT    NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
  persona_id        TEXT    NOT NULL,
  round_number      INTEGER NOT NULL,
  target_persona_id TEXT,
  stance_title      TEXT,
  content           TEXT    NOT NULL,
  confidence        INTEGER,
  actions           TEXT,   -- JSON array stored as text
  warning           TEXT,
  created_at        TEXT    NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);

CREATE INDEX IF NOT EXISTS idx_council_turns_session_round
  ON council_turns (session_id, round_number);

-- ─── Updated-at Triggers ──────────────────────────────────────────────────────

CREATE TRIGGER IF NOT EXISTS users_updated_at
  AFTER UPDATE ON users
  FOR EACH ROW
BEGIN
  UPDATE users SET updated_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now')
  WHERE id = NEW.id;
END;

CREATE TRIGGER IF NOT EXISTS sessions_updated_at
  AFTER UPDATE ON sessions
  FOR EACH ROW
BEGIN
  UPDATE sessions SET updated_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now')
  WHERE id = NEW.id;
END;
