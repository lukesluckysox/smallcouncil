import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';

// ─── DB Path ───────────────────────────────────────────────────────────────────
// Railway: set DATABASE_PATH=/data/smallcouncil.db (volume mounted at /data)
// Local dev: falls back to <project>/data/smallcouncil.db

const DB_FILE =
  process.env.DATABASE_PATH ??
  path.join(process.cwd(), 'data', 'smallcouncil.db');

// Ensure the directory exists before opening (needed on first boot)
const dbDir = path.dirname(DB_FILE);
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

// ─── Singleton ────────────────────────────────────────────────────────────────

let _db: Database.Database | null = null;

function getDb(): Database.Database {
  if (!_db) {
    _db = new Database(DB_FILE);
    // WAL mode: concurrent reads don't block writes
    _db.pragma('journal_mode = WAL');
    // Enforce foreign-key constraints
    _db.pragma('foreign_keys = ON');
    // Auto-initialize schema on first open — idempotent (all IF NOT EXISTS)
    // More reliable than instrumentation.ts which can be skipped by Next.js
    const schemaPath = path.join(process.cwd(), 'sql', 'schema.sql');
    if (fs.existsSync(schemaPath)) {
      const sql = fs.readFileSync(schemaPath, 'utf-8');
      _db.exec(sql);
    }
  }
  return _db;
}

// ─── Query Helpers ─────────────────────────────────────────────────────────────
// Async wrappers keep the calling code unchanged.
// Use ? placeholders in all SQL (not $1/$2 — that is PostgreSQL syntax).
// INSERT ... RETURNING * works via .all() with better-sqlite3 / SQLite 3.35+.

export async function query<T>(sql: string, params: unknown[] = []): Promise<T[]> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return getDb().prepare(sql).all(...(params as any[])) as T[];
}

export async function queryOne<T>(sql: string, params: unknown[] = []): Promise<T | null> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const rows = getDb().prepare(sql).all(...(params as any[])) as T[];
  return rows[0] ?? null;
}

// Exposed for instrumentation.ts schema init
export function getDbInstance(): Database.Database {
  return getDb();
}
