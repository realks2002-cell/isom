'use client';

import { useState } from 'react';
import { Download } from 'lucide-react';
import type { FloorPlan } from '@/types/room';
import { exportFloorPlanPng, sharePng, sanitizeFilename } from '@/lib/export';

export function ExportButton({
  floorPlan,
  projectName,
}: {
  floorPlan: FloorPlan;
  projectName: string;
}) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handle = async () => {
    setBusy(true);
    setError(null);
    try {
      const blob = await exportFloorPlanPng(floorPlan);
      const filename = `${sanitizeFilename(projectName)}.png`;
      await sharePng(blob, filename, projectName);
    } catch (e) {
      setError(e instanceof Error ? e.message : '내보내기 실패');
      setTimeout(() => setError(null), 3000);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex flex-col items-end gap-1">
      <button
        onClick={handle}
        disabled={busy}
        className="flex items-center gap-1.5 rounded-lg bg-neutral-900 text-white px-3 py-1.5 text-xs font-medium hover:bg-neutral-800 disabled:opacity-50 shadow-sm"
      >
        <Download size={14} />
        {busy ? '저장 중...' : 'PNG 저장'}
      </button>
      {error && (
        <div className="rounded-md bg-red-600 text-white text-[11px] px-2 py-1 shadow">
          {error}
        </div>
      )}
    </div>
  );
}
