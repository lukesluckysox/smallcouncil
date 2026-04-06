import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';

// ─── DB Path ───────────────────────────────────────────────────────────────────
// Railway: set DATABASE_PATH=/data/smallcouncil.db (volume mounted at /data)
// Local dev: falls back to <project>/data/smallcouncil.db

const DB_FILE =
  process.env.DATABASE_PATH ??
  path.join(process.cwd(), 'data', 'smallcouncil.db');

const dbDir = path.dirname(DB_FILE);
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

// ─── Inlined Schema ───────────────────────────────────────────────────────────
// Inlined here so it's always available in production — no filesystem lookup.
// Every statement uses IF NOT EXISTS so this is fully idempotent.

const SCHEMA_SQL = `
CREATE TABLE IF NOT EXISTS users (
  id            TEXT PRIMARY KEY,
  email         TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  created_at    TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  updated_at    TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
);

CREATE INDEX IF NOT EXISTS idx_users_email ON users (email);

CREATE TABLE IF NOT EXISTS auth_sessions (
  id          TEXT PRIMARY KEY,
  user_id     TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token       TEXT UNIQUE NOT NULL,
  expires_at  TEXT NOT NULL,
  created_at  TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
);

CREATE INDEX IF NOT EXISTS idx_auth_sessions_token   ON auth_sessions (token);
CREATE INDEX IF NOT EXISTS idx_auth_sessions_user_id ON auth_sessions (user_id);

CREATE TABLE IF NOT EXISTS sessions (
  id              TEXT PRIMARY KEY,
  user_id         TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title           TEXT,
  dilemma         TEXT NOT NULL,
  council_summary TEXT,
  ruling          TEXT,
  status          TEXT NOT NULL DEFAULT 'active',
  created_at      TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  updated_at      TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
);

CREATE INDEX IF NOT EXISTS idx_sessions_user_id_created
  ON sessions (user_id, created_at DESC);

CREATE TABLE IF NOT EXISTS council_turns (
  id                TEXT    PRIMARY KEY,
  session_id        TEXT    NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
  persona_id        TEXT    NOT NULL,
  round_number      INTEGER NOT NULL,
  target_persona_id TEXT,
  stance_title      TEXT,
  content           TEXT    NOT NULL,
  confidence        INTEGER,
  actions           TEXT,
  warning           TEXT,
  created_at        TEXT    NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
);

CREATE INDEX IF NOT EXISTS idx_council_turns_session_round
  ON council_turns (session_id, round_number);
`;

// ─── Singleton ────────────────────────────────────────────────────────────────

let _db: Database.Database | null = null;

function getDb(): Database.Database {
  if (!_db) {
    _db = new Database(DB_FILE);
    _db.pragma('journal_mode = WAL');
    _db.pragma('foreign_keys = ON');
    try {
      _db.exec(SCHEMA_SQL);
    } catch (err) {
      console.error('[db] Schema init error:', err);
      // Don't throw — DB is open, individual queries will surface real errors
    }
  }
  return _db;
}

// ─── Query Helpers ─────────────────────────────────────────────────────────────
// Use ? placeholders in all SQL (SQLite syntax, not $1/$2 PostgreSQL syntax).

export async function query<T>(sql: string, params: unknown[] = []): Promise<T[]> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return getDb().prepare(sql).all(...(params as any[])) as T[];
}

export async function queryOne<T>(sql: string, params: unknown[] = []): Promise<T | null> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const rows = getDb().prepare(sql).all(...(params as any[])) as T[];
  return rows[0] ?? null;
}

export function getDbInstance(): Database.Database {
  return getDb();
}
