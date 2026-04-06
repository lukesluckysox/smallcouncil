// ─────────────────────────────────────────────────────────────────────────────
// Small Council — Shared TypeScript Types
// ─────────────────────────────────────────────────────────────────────────────

export type PersonaId =
  | 'instinct'
  | 'critic'
  | 'realist'
  | 'shadow'
  | 'sage';

export interface PersonaMeta {
  id: PersonaId;
  name: string;
  archetype: string;
  color: string;       // CSS custom-property value, e.g. '#8B1A1A'
  accentColor: string; // lighter accent for glows / borders
  description: string; // short public description shown in UI
}

// ─── DB Row Types ─────────────────────────────────────────────────────────────

export interface DbUser {
  id: string;
  email: string;
  password_hash: string;
  created_at: Date;
  updated_at: Date;
}

export interface DbSession {
  id: string;
  user_id: string;
  title: string | null;
  dilemma: string;
  council_summary: string | null;
  ruling: string | null;
  status: 'active' | 'archived';
  created_at: Date;
  updated_at: Date;
}

export interface DbCouncilTurn {
  id: string;
  session_id: string;
  persona_id: PersonaId;
  round_number: 1 | 2;
  target_persona_id: PersonaId | null;
  stance_title: string | null;
  content: string;
  confidence: number | null;
  actions: string[] | null;
  warning: string | null;
  created_at: Date;
}

// ─── Council Result Types (returned from orchestrator) ────────────────────────

export interface Round1Turn {
  personaId: PersonaId;
  stanceTitle: string;
  content: string;
  confidence: number;
  actions: [string, string]; // exactly 2
  warning: string;
}

export interface Round2Turn {
  personaId: PersonaId;
  targetPersonaId: PersonaId;
  content: string;
  recommendation: string;
}

export interface CouncilResult {
  round1: Round1Turn[];
  round2: Round2Turn[];
  summary: string;
}

// ─── API Response Types ───────────────────────────────────────────────────────

export interface SessionWithTurns extends DbSession {
  turns: DbCouncilTurn[];
}

export interface SessionListItem {
  id: string;
  title: string | null;
  dilemma: string;
  ruling: string | null;
  status: string;
  created_at: Date;
  turn_count: number;
}

// ─── Auth ─────────────────────────────────────────────────────────────────────

export interface AuthUser {
  id: string;
  email: string;
}
