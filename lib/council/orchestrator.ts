import Anthropic from '@anthropic-ai/sdk';
import {
  SYSTEM_PROMPTS,
  PERSONA_ORDER,
  CHALLENGE_MAP,
  buildRound1UserPrompt,
  buildRound2UserPrompt,
  PERSONA_META,
} from './personas';
import type {
  PersonaId,
  Round1Turn,
  Round2Turn,
  CouncilResult,
} from '@/lib/types';

const MODEL = process.env.ANTHROPIC_MODEL ?? 'claude-3-5-sonnet-20241022';
const MAX_TOKENS = 1200;
const TIMEOUT_MS = 45000;

function getClient(): Anthropic {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error('ANTHROPIC_API_KEY is not set');
  return new Anthropic({ apiKey });
}

// ─── Parsers ──────────────────────────────────────────────────────────────────

function parseRound1(personaId: PersonaId, raw: string): Round1Turn {
  const get = (label: string): string => {
    const pattern = new RegExp(
      `${label}:\\s*([\\s\\S]*?)(?=\\n(?:CONFIDENCE|RESPONSE|ACTIONS|WARNING):|$)`,
      'i'
    );
    return raw.match(pattern)?.[1]?.trim() ?? '';
  };

  const stanceRaw = get('STANCE');
  const confidenceRaw = get('CONFIDENCE');
  const responseRaw = get('RESPONSE');
  const warningRaw = get('WARNING');

  // Parse actions block
  const actionsMatch = raw.match(
    /ACTIONS:\s*([\s\S]*?)(?=\n(?:WARNING):|$)/i
  );
  const actionsBlock = actionsMatch?.[1]?.trim() ?? '';
  const actionLines = actionsBlock
    .split('\n')
    .map((l) => l.replace(/^\d+\.\s*/, '').trim())
    .filter(Boolean);

  const confidence = Math.max(1, Math.min(10, parseInt(confidenceRaw, 10) || 5));
  const actions: [string, string] = [
    actionLines[0] ?? 'Reflect on what you actually want',
    actionLines[1] ?? 'Take one concrete step before making a final decision',
  ];

  return {
    personaId,
    stanceTitle: stanceRaw || `${PERSONA_META[personaId].name}'s Stance`,
    content: responseRaw || raw,
    confidence,
    actions,
    warning: warningRaw || 'Proceed with awareness.',
  };
}

function parseRound2(
  personaId: PersonaId,
  targetPersonaId: PersonaId,
  raw: string
): Round2Turn {
  const challengeMatch = raw.match(
    /CHALLENGE:\s*([\s\S]*?)(?=\n(?:SHARPENED RECOMMENDATION):|$)/i
  );
  const recMatch = raw.match(
    /SHARPENED RECOMMENDATION:\s*([\s\S]*?)$/i
  );

  return {
    personaId,
    targetPersonaId,
    content: challengeMatch?.[1]?.trim() ?? raw,
    recommendation:
      recMatch?.[1]?.trim() ?? 'Trust your own deeper reading of this situation.',
  };
}

// ─── Single API Call (with timeout + graceful error) ──────────────────────────

async function callPersona(
  client: Anthropic,
  personaId: PersonaId,
  userPrompt: string
): Promise<{ personaId: PersonaId; content: string }> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    const message = await client.messages.create(
      {
        model: MODEL,
        max_tokens: MAX_TOKENS,
        system: SYSTEM_PROMPTS[personaId],
        messages: [{ role: 'user', content: userPrompt }],
      },
      { signal: controller.signal }
    );

    const content =
      message.content[0].type === 'text' ? message.content[0].text : '';
    return { personaId, content };
  } catch (err) {
    console.error(`[Council] ${personaId} failed:`, err);
    return {
      personaId,
      content: `STANCE: Unable to convene\nCONFIDENCE: 1\n\nRESPONSE:\nThis voice could not speak at this time. The council acknowledges the silence.\n\nACTIONS:\n1. Revisit this dilemma when the council is fully present\n2. Consider what this silence itself might mean\n\nWARNING:\nA council without full representation is incomplete.`,
    };
  } finally {
    clearTimeout(timer);
  }
}

// ─── Round 1 — Parallel ───────────────────────────────────────────────────────

async function runRound1(
  client: Anthropic,
  dilemma: string
): Promise<Round1Turn[]> {
  const userPrompt = buildRound1UserPrompt(dilemma);

  const results = await Promise.allSettled(
    PERSONA_ORDER.map((id) => callPersona(client, id, userPrompt))
  );

  return results.map((result, i) => {
    const personaId = PERSONA_ORDER[i];
    if (result.status === 'fulfilled') {
      return parseRound1(personaId, result.value.content);
    }
    // Settle with a fallback — one bad response should not abort the session
    return {
      personaId,
      stanceTitle: 'Voice Unavailable',
      content: 'This voice could not respond at this time.',
      confidence: 1,
      actions: ['Return to this question', 'Trust your own judgment for now'] as [
        string,
        string
      ],
      warning: 'The council was incomplete for this session.',
    };
  });
}

// ─── Round 2 — Sequential (needs Round 1 context) ────────────────────────────

async function runRound2(
  client: Anthropic,
  dilemma: string,
  round1Turns: Round1Turn[]
): Promise<Round2Turn[]> {
  const round1Context = round1Turns.map((t) => ({
    personaId: t.personaId,
    stanceTitle: t.stanceTitle,
    content: t.content,
  }));

  const round2Turns: Round2Turn[] = [];

  for (const personaId of PERSONA_ORDER) {
    const targetId = CHALLENGE_MAP[personaId];
    const userPrompt = buildRound2UserPrompt(
      dilemma,
      personaId,
      targetId,
      round1Context
    );

    const result = await callPersona(client, personaId, userPrompt);
    round2Turns.push(parseRound2(personaId, targetId, result.content));
  }

  return round2Turns;
}

// ─── Council Summary ──────────────────────────────────────────────────────────
// Uses a neutral API call — NOT routed through any persona system prompt.
// This keeps the scribe voice distinct from all five council members.

async function generateSummary(
  client: Anthropic,
  dilemma: string,
  round1: Round1Turn[],
  round2: Round2Turn[]
): Promise<string> {
  const councilTranscript = round1
    .map((t) => {
      const meta = PERSONA_META[t.personaId];
      const r2 = round2.find((r) => r.personaId === t.personaId);
      const challengerMeta = r2 ? PERSONA_META[r2.targetPersonaId] : null;
      return [
        `${meta.name} (${meta.archetype}): "${t.stanceTitle}"`,
        t.content,
        r2 ? `[In debate, challenged ${challengerMeta?.name}: ${r2.content}]` : '',
      ]
        .filter(Boolean)
        .join('\n');
    })
    .join('\n\n---\n\n');

  const NEUTRAL_SYSTEM = `You are the council scribe — a dispassionate recorder who witnessed the full deliberation. You hold no allegiance to any of the five voices. You do not speak as any advisor. You produce clear-eyed synthesis: naming tensions, finding unexpected convergences, and identifying the core tradeoff without resolving it for the person. Your prose is serious, measured, and literary without being florid. Third person, past tense.`;

  const userPrompt = `The dilemma brought before the council:

"${dilemma}"

The full deliberation:

${councilTranscript}

Write the Council Summary — 200-300 words:
- Weave together the major tensions the debate surfaced (do not list them)
- Note where voices found unexpected agreement or convergence
- Name the core tradeoff the person must actually make
- Offer a sharpened interpretive frame — not a verdict
- End with one sentence: the essential question the person must sit with

Do not recap individual stances. Synthesize across the whole record.`;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    const message = await client.messages.create(
      {
        model: MODEL,
        max_tokens: 800,
        system: NEUTRAL_SYSTEM,
        messages: [{ role: 'user', content: userPrompt }],
      },
      { signal: controller.signal }
    );
    const content = message.content[0].type === 'text' ? message.content[0].text : '';
    return content || 'The council deliberated. The record stands.';
  } catch (err) {
    console.error('[Council] Summary generation failed:', err);
    return 'The council deliberated, but the scribe could not complete the record at this time.';
  } finally {
    clearTimeout(timer);
  }
}

// ─── Main Orchestrator ────────────────────────────────────────────────────────

export async function runCouncil(dilemma: string): Promise<CouncilResult> {
  const client = getClient();

  console.log('[Council] Starting Round 1...');
  const round1 = await runRound1(client, dilemma);

  console.log('[Council] Starting Round 2...');
  const round2 = await runRound2(client, dilemma, round1);

  console.log('[Council] Generating summary...');
  const summary = await generateSummary(client, dilemma, round1, round2);

  return { round1, round2, summary };
}
