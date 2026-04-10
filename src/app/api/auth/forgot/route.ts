import { NextResponse, type NextRequest } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const ID_DOMAIN = '@isometrix.local';

function genTempPassword(): string {
  const chars = 'abcdefghjkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let out = '';
  for (let i = 0; i < 10; i++) out += chars[Math.floor(Math.random() * chars.length)];
  return out;
}

export async function POST(req: NextRequest) {
  const body = (await req.json().catch(() => null)) as
    | { userId?: string; recoveryEmail?: string }
    | null;

  const id = (body?.userId || '').trim().toLowerCase();
  const email = (body?.recoveryEmail || '').trim().toLowerCase();

  if (!id || !email) {
    return NextResponse.json({ error: 'ID와 이메일을 입력해주세요' }, { status: 400 });
  }

  const admin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );

  const { data: authList } = await admin.auth.admin.listUsers({ page: 1, perPage: 1000 });
  const user = authList.users.find((u) => u.email === `${id}${ID_DOMAIN}`);

  // 항상 동일한 응답 — ID 존재 여부 leak 방지
  const genericOk = NextResponse.json({ ok: true });

  if (!user) return genericOk;

  const { data: profile } = await admin
    .from('iso_profiles')
    .select('recovery_email')
    .eq('id', user.id)
    .single();

  if (!profile?.recovery_email || profile.recovery_email !== email) {
    return genericOk;
  }

  const tempPassword = genTempPassword();

  const { error: updErr } = await admin.auth.admin.updateUserById(user.id, {
    password: tempPassword,
  });
  if (updErr) {
    return NextResponse.json({ error: '비밀번호 재설정 실패' }, { status: 500 });
  }

  await admin.from('iso_user_credentials').upsert({
    user_id: user.id,
    plain_password: tempPassword,
    updated_at: new Date().toISOString(),
  });

  // TODO: 실제 이메일 발송 연동 (Resend 등)
  console.log('[FORGOT-PASSWORD]', {
    to: email,
    subject: '[ISOPLAN 3D] 임시 비밀번호 안내',
    body: `요청하신 계정(${id})의 임시 비밀번호는 ${tempPassword} 입니다. 로그인 후 즉시 변경해주세요.`,
  });

  return genericOk;
}
