import { NextResponse } from 'next/server';
import { queryOne, query } from '@/lib/db';

/**
 * GET /api/health
 * Diagnostic endpoint — checks SQLite connectivity, table existence, env vars.
 */
export async function GET() {
  const checks: Record<string, unknown> = {
    status: 'ok',
    timestamp: new Date().toISOString(),
    node_env: process.env.NODE_ENV ?? 'unset',
    env: {
      DATABASE_PATH: process.env.DATABASE_PATH ?? '(default)',
      ANTHROPIC_API_KEY: !!process.env.ANTHROPIC_API_KEY,
      SESSION_SECRET: !!process.env.SESSION_SECRET,
      APP_URL: process.env.APP_URL ?? 'unset',
    },
    db: 'untested',
  };

  try {
    // Basic connectivity
    const row = await queryOne<{ ts: string }>(
      `SELECT strftime('%Y-%m-%dT%H:%M:%fZ', 'now') AS ts`,
      []
    );
    checks.db = 'ok';
    checks.db_time = row?.ts;

    // Check tables exist
    const tables = await query<{ name: string }>(
      `SELECT name FROM sqlite_master
       WHERE type = 'table'
         AND name IN ('users', 'auth_sessions', 'sessions', 'council_turns')`,
      []
    );
    checks.tables_present = tables.length;
    checks.tables = tables.map((t) => t.name);
  } catch (err: unknown) {
    checks.db = 'error';
    checks.db_error = err instanceof Error ? err.message : String(err);
    return NextResponse.json(checks, { status: 503 });
  }

  return NextResponse.json(checks);
}
