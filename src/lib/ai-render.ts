import { GoogleGenAI } from '@google/genai';
import type { Room } from '@/types/room';
import {
  buildMaterialPrompt,
  buildRenderPrompt,
  type RenderStyle,
  type FurnitureLevel,
} from './ai-render-prompts';
import type { BuildingType } from './building-types';

export type RenderQuality = 'fast' | 'high';

export interface RenderOptions {
  style: RenderStyle;
  quality: RenderQuality;
  furniture?: FurnitureLevel;
  buildingType?: BuildingType;
}

const MODEL_FAST =
  process.env.AI_RENDER_MODEL_FAST || 'gemini-3.1-flash-image-preview';
const MODEL_HIGH =
  process.env.AI_RENDER_MODEL_HIGH || 'gemini-3-pro-image-preview';

export async function renderWithNanoBanana(
  imageBase64: string,
  rooms: Room[],
  options: RenderOptions
): Promise<string> {
  const apiKey = process.env.GOOGLE_AI_API_KEY;
  if (!apiKey) throw new Error('GOOGLE_AI_API_KEY 미설정');

  const ai = new GoogleGenAI({ apiKey });
  const model = options.quality === 'fast' ? MODEL_FAST : MODEL_HIGH;
  const bt = options.buildingType ?? 'apartment';
  const prompt = buildRenderPrompt(
    buildMaterialPrompt(rooms, bt),
    options.style,
    options.furniture ?? 'none',
    bt
  );

  const response = await ai.models.generateContent({
    model,
    contents: [
      {
        role: 'user',
        parts: [
          { inlineData: { mimeType: 'image/png', data: imageBase64 } },
          { text: prompt },
        ],
      },
    ],
  });

  const parts = response.candidates?.[0]?.content?.parts ?? [];
  for (const part of parts) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const inline = (part as any).inlineData;
    if (inline?.data) return inline.data as string;
  }
  throw new Error('AI 렌더링 결과에 이미지가 없습니다');
}
