'use client';

import type { PartType } from '@/types/room';

const PARTS: { value: PartType; label: string }[] = [
  { value: 'floor', label: '바닥' },
  { value: 'wall', label: '벽' },
  { value: 'door', label: '도어' },
  { value: 'baseboard', label: '걸레받이' },
  { value: 'ceiling', label: '천장' },
];

export function PartSelector({
  value,
  onChange,
}: {
  value: PartType;
  onChange: (v: PartType) => void;
}) {
  return (
    <div className="flex gap-1 p-1 bg-neutral-100 rounded-lg">
      {PARTS.map((p) => (
        <button
          key={p.value}
          onClick={() => onChange(p.value)}
          className={`flex-1 px-2 py-1.5 text-xs font-medium rounded-md transition ${
            value === p.value
              ? 'bg-white text-neutral-900 shadow-sm'
              : 'text-neutral-600 hover:text-neutral-900'
          }`}
        >
          {p.label}
        </button>
      ))}
    </div>
  );
}
