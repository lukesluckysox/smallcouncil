import { cookies } from 'next/headers';
import crypto from 'crypto';
import { query, queryOne } from '@/lib/db';
import type { AuthUser, DbUser } from '@/lib/types';

export const COOKIE_NAME = 'sc_session';
export const SESSION_DURATION_DAYS = 30;
export const SESSION_MAX_AGE_SECONDS = SESSION_DURATION_DAYS * 24 * 60 * 60;

// ─── Token Generation ─────────────────────────────────────────────────────────

export function generateToken(): string {
  return crypto.randomBytes(48).toString('hex');
}

// ─── Create Session (DB only — caller sets the cookie) ────────────────────────

export async function createSession(userId: string): Promise<string> {
  const id = crypto.randomUUID();
  const token = generateToken();
  const expiresAt = new Date(
    Date.now() + SESSION_DURATION_DAYS * 24 * 60 * 60 * 1000
  ).toISOString();

  await query(
    `INSERT INTO auth_sessions (id, user_id, token, expires_at)
     VALUES (?, ?, ?, ?)`,
    [id, userId, token, expiresAt]
  );

  return token;
}

// ─── Get Current User (reads cookie — safe in Route Handlers) ─────────────────

export async function getCurrentUser(): Promise<AuthUser | null> {
  const cookieStore = cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  if (!token) return null;

  const row = await queryOne<{ user_id: string; email: string; expires_at: string }>(
    `SELECT a.user_id, u.email, a.expires_at
     FROM auth_sessions a
     JOIN users u ON u.id = a.user_id
     WHERE a.token = ?`,
    [token]
  );

  if (!row) return null;
  if (new Date(row.expires_at) < new Date()) {
    await query(`DELETE FROM auth_sessions WHERE token = ?`, [token]);
    return null;
  }

  return { id: row.user_id, email: row.email };
}

// ─── Get Session Token (reads cookie — safe in Route Handlers) ────────────────

export function getSessionToken(): string | null {
  const cookieStore = cookies();
  return cookieStore.get(COOKIE_NAME)?.value ?? null;
}

// ─── Destroy Session (DB only — caller deletes cookie via NextResponse) ───────

export async function destroySession(): Promise<void> {
  const cookieStore = cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  if (token) {
    await query(`DELETE FROM auth_sessions WHERE token = ?`, [token]);
  }
}

// ─── Require Auth ─────────────────────────────────────────────────────────────

export async function requireUser(): Promise<AuthUser> {
  const user = await getCurrentUser();
  if (!user) throw new Error('UNAUTHORIZED');
  return user;
}

// ─── Find User By Email ───────────────────────────────────────────────────────

export async function findUserByEmail(email: string): Promise<DbUser | null> {
  return queryOne<DbUser>(
    `SELECT * FROM users WHERE email = ?`,
    [email.toLowerCase().trim()]
  );
}

// ─── Create User ─────────────────────────────────────────────────────────────

export async function createUser(
  email: string,
  passwordHash: string
): Promise<DbUser> {
  const id = crypto.randomUUID();
  const now = new Date().toISOString();
  const rows = await query<DbUser>(
    `INSERT INTO users (id, email, password_hash, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?)
     RETURNING *`,
    [id, email.toLowerCase().trim(), passwordHash, now, now]
  );
  return rows[0];
}
