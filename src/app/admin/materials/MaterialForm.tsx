'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { invalidateMaterialsCache } from '@/hooks/useMaterials';
import type { PatternType } from '@/types/room';

interface Category {
  id: string;
  name: string;
  parent_type: string;
}

const PATTERNS: PatternType[] = [
  'solid',
  'tile',
  'wood',
  'herringbone',
  'marble',
  'brick',
  'subway',
  'terrazzo',
  'concrete',
];

export function MaterialForm({ categories }: { categories: Category[] }) {
  const router = useRouter();
  const [name, setName] = useState('');
  const [brand, setBrand] = useState('');
  const [categoryId, setCategoryId] = useState(categories[0]?.id ?? '');
  const [colorHex, setColorHex] = useState('#D4C5A9');
  const [patternType, setPatternType] = useState<PatternType>('solid');
  const [tileSize, setTileSize] = useState<string>('');
  const [isPending, startTransition] = useTransition();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !categoryId) return;
    startTransition(async () => {
      const supabase = createClient();
      const { error } = await supabase.from('iso_materials').insert({
        name,
        brand: brand || null,
        category_id: categoryId,
        color_hex: colorHex,
        pattern_type: patternType,
        tile_size_mm: tileSize ? parseInt(tileSize) : null,
      });
      if (error) {
        alert('등록 실패: ' + error.message);
        return;
      }
      setName('');
      setBrand('');
      setTileSize('');
      invalidateMaterialsCache();
      router.refresh();
    });
  };

  return (
    <form onSubmit={handleSubmit} className="grid grid-cols-1 sm:grid-cols-2 gap-3">
      <input
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="자재명"
        required
        className="rounded-lg border border-neutral-300 px-3 py-2 text-sm"
      />
      <input
        value={brand}
        onChange={(e) => setBrand(e.target.value)}
        placeholder="브랜드 (선택)"
        className="rounded-lg border border-neutral-300 px-3 py-2 text-sm"
      />
      <select
        value={categoryId}
        onChange={(e) => setCategoryId(e.target.value)}
        className="rounded-lg border border-neutral-300 px-3 py-2 text-sm bg-white"
        required
      >
        {categories.map((c) => (
          <option key={c.id} value={c.id}>
            {c.parent_type} / {c.name}
          </option>
        ))}
      </select>
      <select
        value={patternType}
        onChange={(e) => setPatternType(e.target.value as PatternType)}
        className="rounded-lg border border-neutral-300 px-3 py-2 text-sm bg-white"
      >
        {PATTERNS.map((p) => (
          <option key={p} value={p}>
            {p}
          </option>
        ))}
      </select>
      <label className="flex items-center gap-3 rounded-lg border border-neutral-300 px-3 py-1.5 text-sm">
        <span className="text-neutral-600 text-xs">색상</span>
        <input
          type="color"
          value={colorHex}
          onChange={(e) => setColorHex(e.target.value)}
          className="w-8 h-8 rounded cursor-pointer"
        />
        <span className="font-mono text-xs">{colorHex}</span>
      </label>
      <input
        value={tileSize}
        onChange={(e) => setTileSize(e.target.value)}
        placeholder="타일 크기 mm (선택)"
        type="number"
        className="rounded-lg border border-neutral-300 px-3 py-2 text-sm"
      />
      <button
        type="submit"
        disabled={isPending}
        className="sm:col-span-2 rounded-lg bg-neutral-900 text-white py-2 text-sm font-medium disabled:opacity-50"
      >
        {isPending ? '등록 중...' : '자재 등록'}
      </button>
    </form>
  );
}
