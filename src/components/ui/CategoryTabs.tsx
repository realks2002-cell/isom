'use client';

import type { MaterialCategory } from '@/types/material';

export function CategoryTabs({
  categories,
  value,
  onChange,
}: {
  categories: MaterialCategory[];
  value: string | null;
  onChange: (id: string) => void;
}) {
  if (categories.length <= 1) return null;
  return (
    <div className="flex gap-1.5 overflow-x-auto pb-1 -mx-1 px-1">
      {categories.map((c) => (
        <button
          key={c.id}
          onClick={() => onChange(c.id)}
          className={`px-3 py-1.5 text-xs font-medium rounded-full whitespace-nowrap border transition ${
            value === c.id
              ? 'bg-neutral-900 text-white border-neutral-900'
              : 'bg-white text-neutral-700 border-neutral-200 hover:border-neutral-400'
          }`}
        >
          {c.name}
        </button>
      ))}
    </div>
  );
}
