import { NextResponse, type NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const body = await req.json().catch(() => null);
  const dataUrl = body?.dataUrl as string | undefined;
  if (!dataUrl || !dataUrl.startsWith('data:image/')) {
    return NextResponse.json({ error: 'invalid' }, { status: 400 });
  }

  const base64 = dataUrl.split(',')[1];
  if (!base64) return NextResponse.json({ error: 'invalid' }, { status: 400 });

  const buf = Buffer.from(base64, 'base64');
  const path = `thumbnails/${user.id}/${id}.jpg`;

  const { error: uploadErr } = await supabase.storage
    .from('iso-projects')
    .upload(path, buf, {
      contentType: 'image/jpeg',
      upsert: true,
    });

  if (uploadErr) {
    // 버킷 없으면 iso-material-textures 로 fallback 시도하지 않고 에러
    return NextResponse.json({ error: uploadErr.message }, { status: 500 });
  }

  const { data: urlData } = supabase.storage
    .from('iso-projects')
    .getPublicUrl(path);

  const { error: dbErr } = await supabase
    .from('iso_projects')
    .update({ thumbnail_url: urlData.publicUrl })
    .eq('id', id)
    .eq('user_id', user.id);

  if (dbErr) {
    return NextResponse.json({ error: dbErr.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true, url: urlData.publicUrl });
}
