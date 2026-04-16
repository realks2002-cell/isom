import { NextResponse, type NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { renderWithNanoBanana, type RenderQuality } from '@/lib/ai-render';
import type { RenderStyle, FurnitureLevel, LightingStyle } from '@/lib/ai-render-prompts';
import type { BuildingType } from '@/lib/building-types';
import type { Room } from '@/types/room';
import { addWatermark } from '@/lib/watermark';

// Gemini 이미지 생성은 시간이 걸릴 수 있음
export const maxDuration = 300;


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
    lighting?: LightingStyle;
    buildingType?: BuildingType;
    refinementPrompt?: string;
  } | null;

  if (!body?.imageBase64) {
    return NextResponse.json({ error: '이미지가 필요합니다' }, { status: 400 });
  }

  // 잔여 렌더링 체크 (구매 횟수 - 총 사용 횟수)
  const { data: profile } = await supabase
    .from('iso_profiles')
    .select('purchased_renders')
    .eq('id', user.id)
    .single();
  const purchased = profile?.purchased_renders ?? 0;

  const { count } = await supabase
    .from('iso_renders')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', user.id);
  const used = count ?? 0;

  if (used >= purchased) {
    return NextResponse.json(
      { error: `잔여 렌더링이 없습니다 (${used}/${purchased}회 사용)` },
      { status: 429 }
    );
  }

  try {
    const resultBase64 = await renderWithNanoBanana(body.imageBase64, body.rooms ?? [], {
      style: body.style ?? 'modern',
      quality: body.quality ?? 'fast',
      furniture: body.furniture ?? 'none',
      lighting: body.lighting,
      buildingType: body.buildingType,
      directImage: !body.rooms || body.rooms.length === 0,
      refinementPrompt: body.refinementPrompt,
    });

    // 워터마크 비활성화 (결제 연동 후 활성화)
    const finalBase64 = resultBase64;

    // Storage 저장
    const projectId = body.projectId || 'quick';
    const fileName = `${user.id}/${projectId}/${Date.now()}.png`;
    const buffer = Buffer.from(finalBase64, 'base64');
    const upload = await supabase.storage
      .from('iso-renders')
      .upload(fileName, buffer, { contentType: 'image/png' });

    let publicUrl: string | null = null;
    if (!upload.error) {
      const { data } = supabase.storage.from('iso-renders').getPublicUrl(fileName);
      publicUrl = data.publicUrl;

      const { data: inserted } = await supabase.from('iso_renders').insert({
        user_id: user.id,
        project_id: body.projectId || null,
        storage_path: fileName,
        public_url: publicUrl,
        style: body.style ?? 'modern',
        quality: body.quality ?? 'fast',
      }).select('id').single();

      return NextResponse.json({
        imageBase64: finalBase64,
        url: publicUrl,
        renderId: inserted?.id ?? null,
        remaining: purchased - used - 1,
      });
    }

    return NextResponse.json({
      imageBase64: finalBase64,
      url: null,
      renderId: null,
      remaining: purchased - used - 1,
    });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : 'AI 렌더링 실패' },
      { status: 500 }
    );
  }
}
