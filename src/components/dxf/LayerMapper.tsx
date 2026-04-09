'use client';

import type { LayerInfo, ArchPart } from '@/lib/dxf/parser';
import type { LayerMapping } from '@/lib/dxf-to-rooms';

const OPTIONS: { value: ArchPart; label: string }[] = [
  { value: 'wall', label: '벽' },
  { value: 'door', label: '문' },
  { value: 'window', label: '창문' },
  { value: 'ignore', label: '무시' },
];

export function LayerMapper({
  layers,
  mapping,
  onChange,
}: {
  layers: LayerInfo[];
  mapping: LayerMapping;
  onChange: (next: LayerMapping) => void;
}) {
  return (
    <div className="rounded-2xl border border-neutral-200 bg-white divide-y divide-neutral-100">
      <div className="px-4 py-3">
        <h3 className="text-sm font-medium">레이어 매핑</h3>
        <p className="text-xs text-neutral-500 mt-0.5">
          각 레이어가 건축 요소 중 무엇인지 지정해주세요.
        </p>
      </div>
      {layers.map((l) => (
        <div key={l.name} className="px-4 py-2.5 flex items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="text-sm font-medium truncate">{l.name}</p>
            <p className="text-xs text-neutral-500">{l.entityCount}개 엔티티</p>
          </div>
          <select
            value={mapping[l.name] ?? 'ignore'}
            onChange={(e) =>
              onChange({ ...mapping, [l.name]: e.target.value as ArchPart })
            }
            className="rounded-lg border border-neutral-300 px-2 py-1.5 text-sm bg-white"
          >
            {OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </div>
      ))}
    </div>
  );
}
