import type { Room } from '@/types/room';
import { AI_CONTEXT, getRoomEnglish, type BuildingType } from './building-types';

export type RenderStyle = 'modern' | 'classic' | 'minimal' | 'luxury' | 'scandinavian' | 'clinical' | 'cozy';
export type FurnitureLevel = 'none' | 'minimal' | 'full';
export type LightingStyle = 'practical' | 'mood';

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

const FURNITURE_BY_TYPE: Record<BuildingType, Record<FurnitureLevel, string>> = {
  apartment: {
    none: '- Keep rooms completely empty (no furniture), focus on architectural finishes only',
    minimal: '- Place minimal essential residential furniture: a bed in bedrooms, a sofa in living room, a dining table in kitchen/dining area. Keep furniture simple and sparse.',
    full: '- Furnish each room fully: living room (sofa, coffee table, TV console, rug), bedroom (bed, nightstands, wardrobe), kitchen (dining table, chairs, cabinets), bathroom (basic fixtures). Match the interior style.',
  },
  office: {
    none: '- Keep rooms completely empty (no furniture), focus on architectural finishes only',
    minimal: '- Place minimal office furniture: office desks with chairs in work areas, a meeting table in conference rooms. No residential furniture (no beds, sofas, or home items).',
    full: '- Furnish as a working office: partition desks with monitors, ergonomic chairs, meeting table with chairs, whiteboard, multifunction printer, filing cabinets, reception desk in lobby. No residential furniture whatsoever.',
  },
  hospital: {
    none: '- Keep rooms completely empty (no furniture), focus on architectural finishes only',
    minimal: '- Place minimal medical furniture: examination desk in exam rooms, waiting chairs in waiting areas, reception counter. No residential furniture (no beds except hospital beds, no sofas).',
    full: '- Furnish as a medical facility: examination table and medical equipment in exam rooms, hospital bed in patient rooms, reception counter with computers, waiting area chairs, medicine cabinets, nurse station desk. No residential furniture.',
  },
  retail: {
    none: '- Keep rooms completely empty (no furniture), focus on architectural finishes only',
    minimal: '- Place minimal commercial furniture: counter/cashier area, a few tables and chairs in dining area. No residential furniture.',
    full: '- Furnish as a commercial space: counter with POS system, 2-person and 4-person tables with chairs, display shelves, menu board, storage racks in back. No residential furniture.',
  },
  school: {
    none: '- Keep rooms completely empty (no furniture), focus on architectural finishes only',
    minimal: '- Place minimal classroom furniture: student desks and chairs in rows, a teacher desk at front. No residential furniture (no beds, sofas, or home items).',
    full: '- Furnish as an educational facility: rows of student desks and chairs, teacher desk and chair, blackboard/whiteboard, lockers in hallways, bookshelves in library. No residential furniture whatsoever.',
  },
};

const LIGHTING_PROMPTS: Record<LightingStyle, string> = {
  practical: '- Use standard practical lighting only: fluorescent panel lights, recessed downlights. Do NOT use mood lighting, warm ambient lights, LED strips, decorative pendant lights, or floor lamps.',
  mood: '- Use warm mood lighting: recessed LED downlights with warm tone, indirect cove lighting, LED strips, decorative pendant or floor lamps where appropriate. Create a cozy, inviting atmosphere.',
};

export function getDefaultLighting(buildingType: BuildingType): LightingStyle {
  return buildingType === 'apartment' || buildingType === 'retail' ? 'mood' : 'practical';
}

export function buildRenderPrompt(
  materialDesc: string,
  style: RenderStyle,
  furniture: FurnitureLevel = 'none',
  buildingType: BuildingType = 'apartment',
  lighting?: LightingStyle
): string {
  const context = AI_CONTEXT[buildingType];
  const lightingStyle = lighting ?? getDefaultLighting(buildingType);
  const furniturePrompt = FURNITURE_BY_TYPE[buildingType][furniture];

  return `Transform this isometric floor plan into a photorealistic interior rendering.

${context}

This is an isometric architectural floor plan showing rooms with applied finish materials.
Render it as a photorealistic 3D interior visualization from the same isometric perspective.

Applied materials:
${materialDesc}

Style: ${STYLE_DESCRIPTIONS[style]}

Requirements:
- Render as a photorealistic 3D dollhouse view from above at isometric angle
- Ceiling is removed, showing interior from above
- Walls must have visible thickness (15-20cm cross-section visible from top)
- Wall tops should show clean cross-section cut with dark/black color for contrast
- Render walls, floors, baseboards with realistic textures matching the specified materials
${lightingStyle === 'mood' ? LIGHTING_PROMPTS.mood : LIGHTING_PROMPTS.practical}
${furniturePrompt}
- Photorealistic quality with accurate material reflections and surface detail
- Clean, professional architectural visualization style`;
}
