import { NextResponse } from 'next/server';
import { destroySession, COOKIE_NAME } from '@/lib/auth/session';

export async function POST() {
  try {
    // destroySession() reads the cookie (safe) and deletes the DB record.
    // Cookie deletion is done here via response.cookies — reliable in Route Handlers.
    await destroySession();

    const response = NextResponse.json({ success: true });
    response.cookies.set(COOKIE_NAME, '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 0,
      path: '/',
    });
    return response;
  } catch (err) {
    console.error('[Auth/Logout]', err);
    return NextResponse.json({ error: 'Something went wrong' }, { status: 500 });
  }
}
