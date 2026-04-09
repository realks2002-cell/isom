import { NextResponse, type NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { renderWithNanoBanana, type RenderQuality } from '@/lib/ai-render';
import type { RenderStyle, FurnitureLevel } from '@/lib/ai-render-prompts';
import type { Room } from '@/types/room';

// Gemini 이미지 생성은 시간이 걸릴 수 있음
export const maxDuration = 300;

const MONTHLY_LIMIT = parseInt(process.env.AI_RENDER_MONTHLY_LIMIT || '100', 10);

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: '인증이 필요합니다' }, { status: 401 });
  }

  const body = (await req.json().catch(() => null)) as {
    projectId?: string;
    imageBase64?: string;
    rooms?: Room[];
    style?: RenderStyle;
    quality?: RenderQuality;
    furniture?: FurnitureLevel;
  } | null;

  if (!body?.imageBase64 || !body.rooms || !body.projectId) {
    return NextResponse.json({ error: '잘못된 요청' }, { status: 400 });
  }

  // 월간 한도 체크 (현재 월 기준)
  const monthStart = new Date();
  monthStart.setUTCDate(1);
  monthStart.setUTCHours(0, 0, 0, 0);

  const { count } = await supabase
    .from('iso_renders')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', user.id)
    .gte('created_at', monthStart.toISOString());

  if ((count ?? 0) >= MONTHLY_LIMIT) {
    return NextResponse.json(
      { error: `월간 렌더링 한도(${MONTHLY_LIMIT}회) 초과` },
      { status: 429 }
    );
  }

  try {
    const resultBase64 = await renderWithNanoBanana(body.imageBase64, body.rooms, {
      style: body.style ?? 'modern',
      quality: body.quality ?? 'fast',
      furniture: body.furniture ?? 'none',
    });

    // Storage 저장
    const fileName = `${user.id}/${body.projectId}/${Date.now()}.png`;
    const buffer = Buffer.from(resultBase64, 'base64');
    const upload = await supabase.storage
      .from('iso-renders')
      .upload(fileName, buffer, { contentType: 'image/png' });

    let publicUrl: string | null = null;
    if (!upload.error) {
      const { data } = supabase.storage.from('iso-renders').getPublicUrl(fileName);
      publicUrl = data.publicUrl;

      await supabase.from('iso_renders').insert({
        user_id: user.id,
        project_id: body.projectId,
        storage_path: fileName,
        public_url: publicUrl,
        style: body.style ?? 'modern',
        quality: body.quality ?? 'fast',
      });
    }

    return NextResponse.json({
      imageBase64: resultBase64,
      url: publicUrl,
      remaining: MONTHLY_LIMIT - (count ?? 0) - 1,
    });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : 'AI 렌더링 실패' },
      { status: 500 }
    );
  }
}
