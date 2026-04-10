import { cookies } from 'next/headers';

// 관리자 하드코딩 인증 (Supabase Auth와 완전 분리)
export const ADMIN_USERNAME = 'realks22';
export const ADMIN_PASSWORD = 'Ks2002';

const COOKIE_NAME = 'iso_admin';
const COOKIE_VALUE = 'isoadmin_a7f3k9x2m1p8q4w5';
const MAX_AGE = 60 * 60 * 24 * 7; // 7일

export async function isAdminAuthed(): Promise<boolean> {
  const store = await cookies();
  return store.get(COOKIE_NAME)?.value === COOKIE_VALUE;
}

export async function setAdminCookie() {
  const store = await cookies();
  store.set(COOKIE_NAME, COOKIE_VALUE, {
    httpOnly: true,
    secure: true,
    sameSite: 'lax',
    path: '/',
    maxAge: MAX_AGE,
  });
}

export async function clearAdminCookie() {
  const store = await cookies();
  store.delete(COOKIE_NAME);
}
