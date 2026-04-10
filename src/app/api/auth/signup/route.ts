import { NextResponse, type NextRequest } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const ID_DOMAIN = '@isometrix.local';

export async function POST(req: NextRequest) {
  const body = (await req.json().catch(() => null)) as
    | { userId?: string; password?: string }
    | null;

  if (!body?.userId || !body.password) {
    return NextResponse.json({ error: '잘못된 요청' }, { status: 400 });
  }

  const id = body.userId.trim().toLowerCase();
  if (!/^[a-z0-9_-]{2,}$/i.test(id)) {
    return NextResponse.json(
      { error: 'ID는 영문/숫자/_/- 조합 2자 이상이어야 합니다' },
      { status: 400 }
    );
  }
  if (body.password.length < 6) {
    return NextResponse.json(
      { error: '비밀번호는 6자 이상이어야 합니다' },
      { status: 400 }
    );
  }

  const admin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );

  const { data: created, error } = await admin.auth.admin.createUser({
    email: `${id}${ID_DOMAIN}`,
    password: body.password,
    email_confirm: true,
  });

  if (error) {
    const msg = error.message.includes('already')
      ? '이미 존재하는 ID입니다'
      : error.message;
    return NextResponse.json({ error: msg }, { status: 400 });
  }

  if (created.user) {
    await admin
      .from('iso_user_credentials')
      .upsert({
        user_id: created.user.id,
        plain_password: body.password,
        updated_at: new Date().toISOString(),
      });
  }

  return NextResponse.json({ ok: true });
}
