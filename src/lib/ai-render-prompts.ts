import type { Room } from '@/types/room';
import { AI_CONTEXT, getRoomEnglish, type BuildingType } from './building-types';

export type RenderStyle = 'modern' | 'classic' | 'minimal' | 'luxury' | 'scandinavian' | 'clinical' | 'cozy';
export type FurnitureLevel = 'none' | 'minimal' | 'full';

const STYLE_DESCRIPTIONS: Record<RenderStyle, string> = {
  modern: 'modern contemporary interior with clean lines and neutral tones',
  classic: 'classic elegant interior with warm tones and refined details',
  minimal: 'minimalist interior with white walls, natural light, sparse furnishing',
  luxury: 'high-end luxury interior with premium materials and sophisticated lighting',
  scandinavian: 'Scandinavian interior with light wood, white walls, cozy natural textures',
  clinical: 'clean clinical interior with bright fluorescent lighting, sterile white surfaces, medical-grade finishes',
  cozy: 'warm cozy interior with ambient lighting, natural materials, inviting atmosphere',
};

function describeMaterial(assignment: { patternType: string; color: string }): string {
  const patternMap: Record<string, string> = {
    tile: 'tile',
    wood: 'wood',
    herringbone: 'herringbone wood',
    marble: 'marble',
    solid: 'painted',
    brick: 'brick',
    subway: 'subway tile',
    terrazzo: 'terrazzo',
    concrete: 'concrete',
  };
  return `${patternMap[assignment.patternType] ?? 'painted'} (${assignment.color})`;
}

export function buildMaterialPrompt(rooms: Room[], buildingType: BuildingType = 'apartment'): string {
  return rooms
    .map((r) => {
      const en = getRoomEnglish(r.name, buildingType);
      const label = en !== r.name ? `${r.name} (${en})` : r.name;
      return `${label}: floor=${describeMaterial(r.floor)}, wall=${describeMaterial(
        r.wall
      )}, baseboard=${describeMaterial(r.baseboard)}`;
    })
    .join('. ');
}

const FURNITURE_INSTRUCTIONS: Record<FurnitureLevel, string> = {
  none: '- Keep rooms completely empty (no furniture), focus on architectural finishes only',
  minimal:
    '- Place minimal essential furniture appropriate for each room type (e.g., a bed in bedrooms, a sofa in living room, a dining table in kitchen). Keep furniture simple and sparse.',
  full:
    '- Furnish each room fully and tastefully according to its function (living room: sofa, coffee table, TV console; bedroom: bed, nightstands, wardrobe; kitchen: dining set, cabinets; bathroom: basic fixtures). Use furniture that matches the overall interior style.',
};

export function buildRenderPrompt(
  materialDesc: string,
  style: RenderStyle,
  furniture: FurnitureLevel = 'none',
  buildingType: BuildingType = 'apartment'
): string {
  const context = AI_CONTEXT[buildingType];

  return `Transform this isometric floor plan into a photorealistic interior rendering.

${context}

This is an isometric architectural floor plan showing rooms with applied finish materials.
Render it as a photorealistic 3D interior visualization from the same isometric perspective.

Applied materials:
${materialDesc}

Style: ${STYLE_DESCRIPTIONS[style]}

Requirements:
- Keep the same isometric camera angle and room layout
- Render walls, floors, baseboards with realistic textures matching the specified materials
- Add realistic lighting: soft ambient light, subtle shadows
- Add realistic ceiling with recessed lighting
${FURNITURE_INSTRUCTIONS[furniture]}
- Photorealistic quality with accurate material reflections and surface detail
- Clean, professional architectural visualization style`;
}
