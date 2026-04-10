import { NextResponse, type NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { GoogleGenAI } from '@google/genai';

export const maxDuration = 60;

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: '인증이 필요합니다' }, { status: 401 });

  const body = await req.json().catch(() => null) as {
    imageBase64?: string;
  } | null;

  if (!body?.imageBase64) {
    return NextResponse.json({ error: '이미지가 필요합니다' }, { status: 400 });
  }

  const apiKey = process.env.GOOGLE_AI_API_KEY;
  if (!apiKey) return NextResponse.json({ error: 'API 키 미설정' }, { status: 500 });

  try {
    const ai = new GoogleGenAI({ apiKey });

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: [
        {
          role: 'user',
          parts: [
            { inlineData: { mimeType: 'image/jpeg', data: body.imageBase64 } },
            {
              text: `Analyze this interior photo and identify the finish materials.
Return a JSON object with this exact structure (no markdown, just raw JSON):
{
  "floor": { "color": "#HEX", "patternType": "tile|wood|herringbone|marble|solid|brick|subway|terrazzo|concrete", "description": "Korean description" },
  "wall": { "color": "#HEX", "patternType": "tile|wood|herringbone|marble|solid|brick|subway|terrazzo|concrete", "description": "Korean description" },
  "baseboard": { "color": "#HEX", "patternType": "solid", "description": "Korean description" },
  "door": { "color": "#HEX", "patternType": "solid", "description": "Korean description" }
}

Rules:
- color must be a valid HEX color code
- patternType must be one of the listed values
- description should be in Korean (e.g., "오크 강마루", "화이트 실크벽지", "포세린 타일")
- If a part is not visible in the photo, make a reasonable guess based on the overall style
- Analyze the actual colors and materials visible in the photo`
            },
          ],
        },
      ],
    });

    const text = response.candidates?.[0]?.content?.parts
      ?.map((p: any) => p.text)
      .filter(Boolean)
      .join('') ?? '';

    // JSON 추출 (마크다운 코드블록 안에 있을 수 있음)
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      return NextResponse.json({ error: 'AI 응답에서 JSON을 찾지 못했습니다' }, { status: 500 });
    }

    const materials = JSON.parse(jsonMatch[0]);
    return NextResponse.json({ materials });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : 'AI 분석 실패' },
      { status: 500 }
    );
  }
}
