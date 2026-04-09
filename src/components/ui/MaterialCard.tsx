'use client';

import type { Material } from '@/types/material';

const PATTERN_BG: Record<string, React.CSSProperties> = {
  tile: {
    backgroundImage:
      'linear-gradient(rgba(0,0,0,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(0,0,0,0.1) 1px, transparent 1px)',
    backgroundSize: '14px 14px',
  },
  subway: {
    backgroundImage:
      'linear-gradient(rgba(0,0,0,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(0,0,0,0.1) 1px, transparent 1px)',
    backgroundSize: '22px 11px',
  },
  brick: {
    backgroundImage:
      'linear-gradient(rgba(0,0,0,0.15) 1px, transparent 1px), linear-gradient(90deg, rgba(0,0,0,0.15) 1px, transparent 1px)',
    backgroundSize: '18px 9px',
  },
  wood: {
    backgroundImage:
      'repeating-linear-gradient(90deg, transparent, transparent 8px, rgba(0,0,0,0.06) 8px, rgba(0,0,0,0.06) 9px)',
  },
  herringbone: {
    backgroundImage:
      'repeating-linear-gradient(45deg, rgba(0,0,0,0.08) 0, rgba(0,0,0,0.08) 1px, transparent 1px, transparent 8px)',
  },
};

export function MaterialCard({
  material,
  selected,
  onClick,
}: {
  material: Material;
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`group relative aspect-square rounded-lg overflow-hidden border-2 transition ${
        selected
          ? 'border-neutral-900 shadow-md'
          : 'border-transparent hover:border-neutral-400'
      }`}
      style={{ backgroundColor: material.colorHex, ...PATTERN_BG[material.patternType] }}
    >
      <div className="absolute inset-x-0 bottom-0 bg-black/60 text-white text-[10px] px-1.5 py-1 text-left leading-tight">
        <div className="truncate font-medium">{material.name}</div>
        {material.brand && <div className="truncate opacity-70">{material.brand}</div>}
      </div>
    </button>
  );
}
