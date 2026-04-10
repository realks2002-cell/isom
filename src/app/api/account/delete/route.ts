import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: '로그인이 필요합니다' }, { status: 401 });
  }

  const admin = createAdminClient();

  // Storage 파일 정리 (renders/{userId}/*, dxf/{userId}/* 등)
  for (const bucket of ['renders', 'dxf', 'thumbnails']) {
    const { data: files } = await admin.storage.from(bucket).list(user.id);
    if (files && files.length > 0) {
      await admin.storage
        .from(bucket)
        .remove(files.map((f) => `${user.id}/${f.name}`));
    }
  }

  // iso_profiles CASCADE로 iso_projects, iso_folders, iso_user_credentials 같이 삭제됨
  const { error: delErr } = await admin.auth.admin.deleteUser(user.id);
  if (delErr) {
    return NextResponse.json(
      { error: `계정 삭제 실패: ${delErr.message}` },
      { status: 500 }
    );
  }

  await supabase.auth.signOut();
  return NextResponse.redirect(new URL('/', request.url), { status: 303 });
}
