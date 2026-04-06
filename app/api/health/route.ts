import { NextResponse } from 'next/server';
import { queryOne } from '@/lib/db';

/**
 * GET /api/health
 *
 * Diagnostic endpoint for Railway. Returns DB connectivity status,
 * environment variable presence, and runtime info.
 * Does NOT expose any user data.
 */
export async function GET() {
  const checks: Record<string, unknown> = {
    status: 'ok',
    timestamp: new Date().toISOString(),
    node_env: process.env.NODE_ENV ?? 'unset',
    env: {
      DATABASE_URL: !!process.env.DATABASE_URL,
      ANTHROPIC_API_KEY: !!process.env.ANTHROPIC_API_KEY,
      SESSION_SECRET: !!process.env.SESSION_SECRET,
      APP_URL: process.env.APP_URL ?? 'unset',
    },
    db: 'untested',
  };

  // Test DB connectivity
  try {
    const row = await queryOne<{ now: string }>('SELECT NOW() AS now', []);
    checks.db = 'ok';
    checks.db_time = row?.now;

    // Check if tables exist
    const tables = await queryOne<{ count: string }>(
      `SELECT COUNT(*)::text AS count
       FROM information_schema.tables
       WHERE table_schema = 'public'
         AND table_name IN ('users', 'auth_sessions', 'sessions', 'council_turns')`,
      []
    );
    checks.tables_present = Number(tables?.count ?? 0);
  } catch (err: unknown) {
    checks.db = 'error';
    checks.db_error = err instanceof Error ? err.message : String(err);
    return NextResponse.json(checks, { status: 503 });
  }

  return NextResponse.json(checks);
}
