import { cookies } from 'next/headers';
import crypto from 'crypto';
import { query, queryOne } from '@/lib/db';
import type { AuthUser, DbUser } from '@/lib/types';

const COOKIE_NAME = 'sc_session';
const SESSION_DURATION_DAYS = 30;

// ─── Token Generation ─────────────────────────────────────────────────────────

export function generateToken(): string {
  return crypto.randomBytes(48).toString('hex');
}

// ─── Create Session ───────────────────────────────────────────────────────────

export async function createSession(userId: string): Promise<string> {
  const token = generateToken();
  const expiresAt = new Date(
    Date.now() + SESSION_DURATION_DAYS * 24 * 60 * 60 * 1000
  );

  await query(
    `INSERT INTO auth_sessions (user_id, token, expires_at)
     VALUES ($1, $2, $3)`,
    [userId, token, expiresAt]
  );

  return token;
}

// ─── Set Cookie ───────────────────────────────────────────────────────────────

export async function setSessionCookie(token: string): Promise<void> {
  const cookieStore = cookies();
  cookieStore.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: SESSION_DURATION_DAYS * 24 * 60 * 60,
    path: '/',
  });
}

// ─── Get Current User ─────────────────────────────────────────────────────────

export async function getCurrentUser(): Promise<AuthUser | null> {
  const cookieStore = cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  if (!token) return null;

  const row = await queryOne<{ user_id: string; email: string; expires_at: Date }>(
    `SELECT a.user_id, u.email, a.expires_at
     FROM auth_sessions a
     JOIN users u ON u.id = a.user_id
     WHERE a.token = $1`,
    [token]
  );

  if (!row) return null;
  if (new Date(row.expires_at) < new Date()) {
    // Expired — clean up lazily
    await query(`DELETE FROM auth_sessions WHERE token = $1`, [token]);
    return null;
  }

  return { id: row.user_id, email: row.email };
}

// ─── Get Token From Cookie ────────────────────────────────────────────────────

export function getSessionToken(): string | null {
  const cookieStore = cookies();
  return cookieStore.get(COOKIE_NAME)?.value ?? null;
}

// ─── Destroy Session ──────────────────────────────────────────────────────────

export async function destroySession(): Promise<void> {
  const cookieStore = cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;

  if (token) {
    await query(`DELETE FROM auth_sessions WHERE token = $1`, [token]);
  }

  cookieStore.delete(COOKIE_NAME);
}

// ─── Require Auth (throws-on-fail helper for route handlers) ──────────────────

export async function requireUser(): Promise<AuthUser> {
  const user = await getCurrentUser();
  if (!user) {
    throw new Error('UNAUTHORIZED');
  }
  return user;
}

// ─── Find User By Email ───────────────────────────────────────────────────────

export async function findUserByEmail(email: string): Promise<DbUser | null> {
  return queryOne<DbUser>(
    `SELECT * FROM users WHERE email = $1`,
    [email.toLowerCase().trim()]
  );
}

// ─── Create User ─────────────────────────────────────────────────────────────

export async function createUser(
  email: string,
  passwordHash: string
): Promise<DbUser> {
  const rows = await query<DbUser>(
    `INSERT INTO users (email, password_hash)
     VALUES ($1, $2)
     RETURNING *`,
    [email.toLowerCase().trim(), passwordHash]
  );
  return rows[0];
}
