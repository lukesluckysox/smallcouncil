import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { requireUser } from '@/lib/auth/session';
import { query, queryOne } from '@/lib/db';
import type { DbSession, DbCouncilTurn } from '@/lib/types';

interface RouteParams {
  params: { sessionId: string };
}

// ─── GET /api/sessions/[sessionId] ───────────────────────────────────────────

export async function GET(request: NextRequest, { params }: RouteParams) {
  let user;
  try {
    user = await requireUser();
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const session = await queryOne<DbSession>(
    `SELECT * FROM sessions WHERE id = ? AND user_id = ?`,
    [params.sessionId, user.id]
  );

  if (!session) {
    return NextResponse.json({ error: 'Session not found' }, { status: 404 });
  }

  const rawTurns = await query<DbCouncilTurn & { actions: string | null }>(
    `SELECT * FROM council_turns
     WHERE session_id = ?
     ORDER BY round_number ASC, created_at ASC`,
    [params.sessionId]
  );

  // SQLite stores actions as JSON text — parse back to arrays
  const turns: DbCouncilTurn[] = rawTurns.map((t) => ({
    ...t,
    actions: t.actions ? (JSON.parse(t.actions) as string[]) : null,
  }));

  return NextResponse.json({ session, turns });
}

// ─── PATCH /api/sessions/[sessionId] ─────────────────────────────────────────

const patchSchema = z.object({
  title: z.string().max(120).trim().optional(),
  ruling: z.string().max(5000).trim().optional(),
  status: z.enum(['active', 'archived']).optional(),
});

export async function PATCH(request: NextRequest, { params }: RouteParams) {
  let user;
  try {
    user = await requireUser();
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Verify ownership
  const session = await queryOne<{ id: string }>(
    `SELECT id FROM sessions WHERE id = ? AND user_id = ?`,
    [params.sessionId, user.id]
  );

  if (!session) {
    return NextResponse.json({ error: 'Session not found' }, { status: 404 });
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.errors[0].message },
      { status: 400 }
    );
  }

  const updates = parsed.data;
  const setClauses: string[] = [];
  const values: unknown[] = [];

  // SQLite uses ? placeholders — no $1/$2 indexing needed
  if (updates.title !== undefined) {
    setClauses.push('title = ?');
    values.push(updates.title);
  }
  if (updates.ruling !== undefined) {
    setClauses.push('ruling = ?');
    values.push(updates.ruling);
  }
  if (updates.status !== undefined) {
    setClauses.push('status = ?');
    values.push(updates.status);
  }

  if (setClauses.length === 0) {
    return NextResponse.json({ success: true });
  }

  values.push(params.sessionId);

  await query(
    `UPDATE sessions SET ${setClauses.join(', ')} WHERE id = ?`,
    values
  );

  return NextResponse.json({ success: true });
}
