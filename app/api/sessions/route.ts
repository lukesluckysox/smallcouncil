import { NextResponse } from 'next/server';
import { requireUser } from '@/lib/auth/session';
import { query } from '@/lib/db';
import type { SessionListItem } from '@/lib/types';

export async function GET() {
  let user;
  try {
    user = await requireUser();
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const sessions = await query<SessionListItem>(
      `SELECT
         s.id,
         s.title,
         s.dilemma,
         s.ruling,
         s.status,
         s.created_at,
         CAST(COUNT(ct.id) AS INTEGER) AS turn_count
       FROM sessions s
       LEFT JOIN council_turns ct ON ct.session_id = s.id
       WHERE s.user_id = ?
       GROUP BY s.id
       ORDER BY s.created_at DESC`,
      [user.id]
    );

    return NextResponse.json({ sessions });
  } catch (err) {
    console.error('[Sessions/List]', err);
    return NextResponse.json({ error: 'Failed to load sessions' }, { status: 500 });
  }
}
