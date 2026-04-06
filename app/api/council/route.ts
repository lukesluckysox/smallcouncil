import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { requireUser } from '@/lib/auth/session';
import { runCouncil } from '@/lib/council/orchestrator';
import { query } from '@/lib/db';
import type { CouncilResult, PersonaId } from '@/lib/types';

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
    // Create the session row
    const sessionRows = await query<{ id: string }>(
      `INSERT INTO sessions (user_id, title, dilemma, council_summary, status)
       VALUES ($1, $2, $3, $4, 'active')
       RETURNING id`,
      [
        user.id,
        title ?? null,
        dilemma,
        result.summary,
      ]
    );
    const sessionId = sessionRows[0].id;

    // Insert Round 1 turns
    for (const turn of result.round1) {
      await query(
        `INSERT INTO council_turns
           (session_id, persona_id, round_number, stance_title, content,
            confidence, actions, warning)
         VALUES ($1, $2, 1, $3, $4, $5, $6, $7)`,
        [
          sessionId,
          turn.personaId,
          turn.stanceTitle,
          turn.content,
          turn.confidence,
          JSON.stringify(turn.actions),
          turn.warning,
        ]
      );
    }

    // Insert Round 2 turns
    for (const turn of result.round2) {
      await query(
        `INSERT INTO council_turns
           (session_id, persona_id, round_number, target_persona_id,
            content, actions)
         VALUES ($1, $2, 2, $3, $4, $5)`,
        [
          sessionId,
          turn.personaId,
          turn.targetPersonaId,
          turn.content,
          JSON.stringify([turn.recommendation]),
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
