'use client';

import { useEffect, useState, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { Material, MaterialCategory } from '@/types/material';
import type { PartType } from '@/types/room';

interface State {
  categories: MaterialCategory[];
  materials: Material[];
  loading: boolean;
}

let cache: State | null = null;
let inflight: Promise<State> | null = null;
const subscribers = new Set<(s: State) => void>();

async function loadAll(): Promise<State> {
  const supabase = createClient();
  const [{ data: cats }, { data: mats }] = await Promise.all([
    supabase.from('iso_material_categories').select('*').order('sort_order'),
    supabase.from('iso_materials').select('*').eq('is_active', true),
  ]);
  return {
    categories: (cats ?? []).map((c) => ({
      id: c.id,
      name: c.name,
      parentType: c.parent_type,
      sortOrder: c.sort_order,
    })),
    materials: (mats ?? []).map((m) => ({
      id: m.id,
      categoryId: m.category_id,
      name: m.name,
      brand: m.brand ?? undefined,
      modelNumber: m.model_number ?? undefined,
      colorHex: m.color_hex,
      patternType: m.pattern_type,
      textureUrl: m.texture_url ?? undefined,
      textureThumbUrl: m.texture_thumb_url ?? undefined,
      textureMediumUrl: m.texture_medium_url ?? undefined,
      tileSizeMm: m.tile_size_mm ?? undefined,
      isPreset: m.is_preset,
      isActive: m.is_active,
    })),
    loading: false,
  };
}

function fetchShared(): Promise<State> {
  if (!inflight) {
    inflight = loadAll()
      .then((next) => {
        cache = next;
        subscribers.forEach((s) => s(next));
        return next;
      })
      .catch((e) => {
        cache = null;
        inflight = null;
        const errState: State = { categories: [], materials: [], loading: false };
        subscribers.forEach((s) => s(errState));
        throw e;
      })
      .finally(() => {
        inflight = null;
      });
  }
  return inflight;
}

export function invalidateMaterialsCache() {
  cache = null;
  fetchShared().catch(() => {});
}

export function useMaterials(parentType?: PartType) {
  const [state, setState] = useState<State>(
    cache ?? { categories: [], materials: [], loading: true }
  );

  useEffect(() => {
    subscribers.add(setState);
    if (cache) {
      setState(cache);
    } else {
      fetchShared().catch(() => {});
    }
    return () => {
      subscribers.delete(setState);
    };
  }, []);

  const filteredCategories = parentType
    ? state.categories.filter((c) => c.parentType === parentType)
    : state.categories;

  const getMaterialsByCategory = useCallback(
    (categoryId: string) => state.materials.filter((m) => m.categoryId === categoryId),
    [state.materials]
  );

  return {
    ...state,
    filteredCategories,
    getMaterialsByCategory,
    refresh: invalidateMaterialsCache,
  };
}
