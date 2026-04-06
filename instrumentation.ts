/**
 * instrumentation.ts — Next.js startup hook
 *
 * Runs once per server process start (not per request).
 * Executes the schema SQL against Railway PostgreSQL so tables are always
 * present without a manual `psql` step. All SQL uses IF NOT EXISTS / OR REPLACE,
 * so this is fully idempotent and safe to run on every deploy.
 */
export async function register() {
  // Only run in the Node.js runtime (not Edge), and only server-side
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    const { Pool } = await import('pg');
    const { readFileSync } = await import('fs');
    const { join } = await import('path');

    const connectionString = process.env.DATABASE_URL;
    if (!connectionString) {
      console.warn('[instrumentation] DATABASE_URL not set — skipping schema init');
      return;
    }

    const pool = new Pool({
      connectionString,
      ssl:
        process.env.NODE_ENV === 'production'
          ? { rejectUnauthorized: false }
          : false,
      max: 2,
      connectionTimeoutMillis: 10_000,
    });

    try {
      const schemaPath = join(process.cwd(), 'sql', 'schema.sql');
      const sql = readFileSync(schemaPath, 'utf-8');
      await pool.query(sql);
      console.log('[instrumentation] ✓ Schema initialized');
    } catch (err) {
      // Log but don't crash the server — the app can still serve requests
      // that don't need the DB, and Railway logs will surface the error
      console.error('[instrumentation] Schema init failed:', err);
    } finally {
      await pool.end();
    }
  }
}
