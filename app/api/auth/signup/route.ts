import { NextRequest, NextResponse } from 'next/server';
import bcryptjs from 'bcryptjs';
import { z } from 'zod';
import {
  findUserByEmail,
  createUser,
  createSession,
  COOKIE_NAME,
  SESSION_MAX_AGE_SECONDS,
} from '@/lib/auth/session';

const signupSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .max(100, 'Password too long'),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = signupSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.errors[0].message },
        { status: 400 }
      );
    }

    const { email, password } = parsed.data;

    const existing = await findUserByEmail(email);
    if (existing) {
      return NextResponse.json(
        { error: 'An account with this email already exists' },
        { status: 409 }
      );
    }

    const passwordHash = await bcryptjs.hash(password, 12);
    const user = await createUser(email, passwordHash);

    const token = await createSession(user.id);

    // Set cookie on the response object — the only reliable pattern in Route Handlers
    const response = NextResponse.json({ success: true, userId: user.id });
    response.cookies.set(COOKIE_NAME, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: SESSION_MAX_AGE_SECONDS,
      path: '/',
    });
    return response;
  } catch (err) {
    console.error('[Auth/Signup]', err);
    return NextResponse.json({ error: 'Something went wrong' }, { status: 500 });
  }
}
