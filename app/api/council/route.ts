import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import crypto from 'crypto';
import { requireUser } from '@/lib/auth/session';
import { runCouncil } from '@/lib/council/orchestrator';
import { query } from '@/lib/db';
import type { CouncilResult } from '@/lib/types';

const dilemmaSchema = z.object({
  dilemma: z
    .string()
    .min(20, 'Please describe your dilemma in at least 20 characters')
    .max(2000, 'Dilemma must be under 2000 characters')
    .trim(),
  title: z.string().max(120).trim().optional(),
});

export async function POST(request: NextRequest) {
  let user;
  try {
    user = await requireUser();
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const parsed = dilemmaSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.errors[0].message },
      { status: 400 }
    );
  }

  const { dilemma, title } = parsed.data;

  // Run the council
  let result: CouncilResult;
  try {
    result = await runCouncil(dilemma);
  } catch (err) {
    console.error('[Council] Orchestration failed:', err);
    return NextResponse.json(
      { error: 'The council could not convene at this time. Please try again.' },
      { status: 503 }
    );
  }

  // Persist to DB
  try {
    const sessionId = crypto.randomUUID();
    const now = new Date().toISOString();

    await query(
      `INSERT INTO sessions (id, user_id, title, dilemma, council_summary, status, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, 'active', ?, ?)`,
      [sessionId, user.id, title ?? null, dilemma, result.summary, now, now]
    );

    // Insert Round 1 turns
    for (const turn of result.round1) {
      await query(
        `INSERT INTO council_turns
           (id, session_id, persona_id, round_number, stance_title, content,
            confidence, actions, warning, created_at)
         VALUES (?, ?, ?, 1, ?, ?, ?, ?, ?, ?)`,
        [
          crypto.randomUUID(),
          sessionId,
          turn.personaId,
          turn.stanceTitle,
          turn.content,
          turn.confidence,
          JSON.stringify(turn.actions),
          turn.warning,
          now,
        ]
      );
    }

    // Insert Round 2 turns
    for (const turn of result.round2) {
      await query(
        `INSERT INTO council_turns
           (id, session_id, persona_id, round_number, target_persona_id,
            content, actions, created_at)
         VALUES (?, ?, ?, 2, ?, ?, ?, ?)`,
        [
          crypto.randomUUID(),
          sessionId,
          turn.personaId,
          turn.targetPersonaId,
          turn.content,
          JSON.stringify([turn.recommendation]),
          now,
        ]
      );
    }

    return NextResponse.json({ sessionId, result });
  } catch (err) {
    console.error('[Council] DB write failed:', err);
    return NextResponse.json(
      { error: 'The council spoke, but the record was lost. Please try again.' },
      { status: 500 }
    );
  }
}
