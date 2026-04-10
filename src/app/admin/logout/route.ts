import { NextResponse } from 'next/server';
import { clearAdminCookie } from '@/lib/admin-auth';

export async function POST() {
  await clearAdminCookie();
  return NextResponse.redirect(new URL('/admin', process.env.NEXT_PUBLIC_SITE_URL || 'https://isom-neon.vercel.app'));
}

export async function GET() {
  await clearAdminCookie();
  return NextResponse.redirect(new URL('/admin', process.env.NEXT_PUBLIC_SITE_URL || 'https://isom-neon.vercel.app'));
}
