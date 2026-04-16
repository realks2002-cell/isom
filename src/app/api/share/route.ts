import { NextResponse, type NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { randomBytes } from 'crypto';

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: '인증 필요' }, { status: 401 });

  const body = await req.json().catch(() => null) as { renderId?: string } | null;
  if (!body?.renderId) return NextResponse.json({ error: 'renderId 필요' }, { status: 400 });

  // 이미 share_token이 있는지 확인
  const { data: existing } = await supabase
    .from('iso_renders')
    .select('share_token')
    .eq('id', body.renderId)
    .eq('user_id', user.id)
    .single();

  if (!existing) return NextResponse.json({ error: '렌더링을 찾을 수 없습니다' }, { status: 404 });

  if (existing.share_token) {
    return NextResponse.json({ token: existing.share_token });
  }

  // 새 토큰 생성
  const token = randomBytes(12).toString('base64url');
  const { error } = await supabase
    .from('iso_renders')
    .update({ share_token: token })
    .eq('id', body.renderId);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ token });
}
