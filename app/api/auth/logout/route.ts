import { NextResponse } from 'next/server';
import { destroySession } from '@/lib/auth/session';

export async function POST() {
  try {
    await destroySession();
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('[Auth/Logout]', err);
    return NextResponse.json({ error: 'Something went wrong' }, { status: 500 });
  }
}
