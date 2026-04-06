/**
 * instrumentation.ts — Next.js startup hook
 *
 * Runs once per server process start (not per request).
 * Initialises the SQLite database and creates all tables if they don't
 * exist yet. All SQL uses IF NOT EXISTS so this is fully idempotent.
 */
export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    const { readFileSync } = await import('fs');
    const { join } = await import('path');

    try {
      // Import the singleton db instance so we reuse the same connection
      const { getDbInstance } = await import('@/lib/db');
      const db = getDbInstance();

      const schemaPath = join(process.cwd(), 'sql', 'schema.sql');
      const sql = readFileSync(schemaPath, 'utf-8');

      // better-sqlite3 exec() runs multiple statements separated by semicolons
      db.exec(sql);
      console.log('[instrumentation] ✓ SQLite schema initialised');
    } catch (err) {
      console.error('[instrumentation] Schema init failed:', err);
    }
  }
}
