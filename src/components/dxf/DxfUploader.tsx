'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Upload } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { parseDxf, type ParsedDxf } from '@/lib/dxf/parser';
import { buildFloorPlan, type LayerMapping } from '@/lib/dxf-to-rooms';
import { LayerMapper } from './LayerMapper';

export function DxfUploader({ projectId }: { projectId: string }) {
  const router = useRouter();
  const [parsed, setParsed] = useState<ParsedDxf | null>(null);
  const [mapping, setMapping] = useState<LayerMapping>({});
  const [fileName, setFileName] = useState<string | null>(null);
  const [fileText, setFileText] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleFile = async (file: File) => {
    setError(null);
    setFileName(file.name);
    try {
      const text = await file.text();
      const result = parseDxf(text);
      setParsed(result);
      setFileText(text);
      const init: LayerMapping = {};
      for (const l of result.layers) init[l.name] = l.autoMapped;
      setMapping(init);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'DXF 파싱 실패');
    }
  };

  const handleSave = () => {
    if (!parsed || !fileText || !fileName) return;
    startTransition(async () => {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      const floorPlan = buildFloorPlan(parsed, mapping);
      if (floorPlan.rooms.length === 0) {
        setError('닫힌 영역(방)을 찾지 못했습니다. 레이어 매핑을 다시 확인해주세요.');
        return;
      }

      // DXF 파일 Storage 업로드
      const path = `${user.id}/${projectId}/${Date.now()}-${fileName}`;
      const upload = await supabase.storage
        .from('iso-dxf-files')
        .upload(path, new Blob([fileText], { type: 'application/dxf' }));
      if (upload.error) {
        setError('파일 업로드 실패: ' + upload.error.message);
        return;
      }

      const { error: updateErr } = await supabase
        .from('iso_projects')
        .update({
          dxf_file_url: upload.data.path,
          rooms_data: floorPlan,
        })
        .eq('id', projectId);

      if (updateErr) {
        setError('저장 실패: ' + updateErr.message);
        return;
      }

      router.refresh();
    });
  };

  if (!parsed) {
    return (
      <div className="flex-1 flex items-center justify-center p-8">
        <label className="cursor-pointer flex flex-col items-center gap-3 rounded-2xl border-2 border-dashed border-neutral-300 bg-white px-10 py-12 hover:border-neutral-900 transition">
          <Upload size={32} className="text-neutral-500" />
          <div className="text-center">
            <p className="font-medium text-sm">DXF 파일 업로드</p>
            <p className="text-xs text-neutral-500 mt-1">.dxf 파일을 선택하세요</p>
          </div>
          <input
            type="file"
            accept=".dxf"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) handleFile(f);
            }}
          />
          {error && <p className="text-xs text-red-600">{error}</p>}
        </label>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-auto p-6">
      <div className="max-w-2xl mx-auto space-y-4">
        <div>
          <p className="text-sm font-medium">{fileName}</p>
          <p className="text-xs text-neutral-500">
            단위: {parsed.unit.toUpperCase()} · 레이어 {parsed.layers.length}개
          </p>
        </div>

        <LayerMapper layers={parsed.layers} mapping={mapping} onChange={setMapping} />

        {error && (
          <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{error}</p>
        )}

        <div className="flex justify-end gap-2">
          <button
            onClick={() => {
              setParsed(null);
              setFileText(null);
              setMapping({});
              setError(null);
            }}
            className="px-4 py-2 text-sm text-neutral-600"
          >
            다시 선택
          </button>
          <button
            onClick={handleSave}
            disabled={isPending}
            className="rounded-lg bg-neutral-900 text-white px-4 py-2 text-sm font-medium disabled:opacity-50"
          >
            {isPending ? '저장 중...' : '평면도 저장'}
          </button>
        </div>
      </div>
    </div>
  );
}
