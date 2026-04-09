import type { PatternType, PartType } from './room';

export interface MaterialCategory {
  id: string;
  name: string;
  parentType: PartType;
  sortOrder: number;
}

export interface Material {
  id: string;
  categoryId: string;
  name: string;
  brand?: string;
  modelNumber?: string;
  colorHex: string;
  patternType: PatternType;
  textureUrl?: string;
  textureThumbUrl?: string;
  textureMediumUrl?: string;
  tileSizeMm?: number;
  isPreset: boolean;
  isActive: boolean;
}

export type { PatternType, PartType };
