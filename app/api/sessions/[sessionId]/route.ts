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
    `SELECT * FROM sessions WHERE id = $1 AND user_id = $2`,
    [params.sessionId, user.id]
  );

  if (!session) {
    return NextResponse.json({ error: 'Session not found' }, { status: 404 });
  }

  const turns = await query<DbCouncilTurn>(
    `SELECT * FROM council_turns
     WHERE session_id = $1
     ORDER BY round_number ASC, created_at ASC`,
    [params.sessionId]
  );

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
    `SELECT id FROM sessions WHERE id = $1 AND user_id = $2`,
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
  let idx = 1;

  if (updates.title !== undefined) {
    setClauses.push(`title = $${idx++}`);
    values.push(updates.title);
  }
  if (updates.ruling !== undefined) {
    setClauses.push(`ruling = $${idx++}`);
    values.push(updates.ruling);
  }
  if (updates.status !== undefined) {
    setClauses.push(`status = $${idx++}`);
    values.push(updates.status);
  }

  if (setClauses.length === 0) {
    return NextResponse.json({ success: true });
  }

  values.push(params.sessionId);

  await query(
    `UPDATE sessions SET ${setClauses.join(', ')} WHERE id = $${idx}`,
    values
  );

  return NextResponse.json({ success: true });
}
