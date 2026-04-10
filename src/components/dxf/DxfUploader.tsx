'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Upload, FileWarning, ExternalLink, X, Building2 } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { parseDxf, type ParsedDxf } from '@/lib/dxf/parser';
import { buildFloorPlan, type LayerMapping } from '@/lib/dxf-to-rooms';
import { LayerMapper } from './LayerMapper';
import { BUILDING_TYPES, type BuildingType } from '@/lib/building-types';

export function DxfUploader({ projectId }: { projectId: string }) {
  const router = useRouter();
  const [parsed, setParsed] = useState<ParsedDxf | null>(null);
  const [mapping, setMapping] = useState<LayerMapping>({});
  const [fileName, setFileName] = useState<string | null>(null);
  const [fileText, setFileText] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [dwgWarning, setDwgWarning] = useState(false);
  const [buildingType, setBuildingType] = useState<BuildingType>('apartment');
  const [isPending, startTransition] = useTransition();

  const readFileAsText = async (file: File): Promise<{ text: string; method: string; bytes: number }> => {
    // 방법 1: arrayBuffer + TextDecoder
    try {
      const buf = await file.arrayBuffer();
      if (buf.byteLength > 0) {
        let text: string;
        try {
          text = new TextDecoder('utf-8', { fatal: true }).decode(buf);
        } catch {
          try {
            text = new TextDecoder('euc-kr').decode(buf);
          } catch {
            text = new TextDecoder('windows-1252').decode(buf);
          }
        }
        if (text.charCodeAt(0) === 0xfeff) text = text.slice(1);
        if (text.trim().length > 0) return { text, method: 'arrayBuffer', bytes: buf.byteLength };
      }
    } catch {}

    // 방법 2: file.text() 직접 호출
    try {
      const text = await file.text();
      if (text && text.trim().length > 0) {
        return { text, method: 'file.text', bytes: text.length };
      }
    } catch {}

    // 방법 3: FileReader (가장 오래된 API, Android WebView에서 가장 호환성 높음)
    const reader = new FileReader();
    const text = await new Promise<string>((resolve, reject) => {
      reader.onload = () => resolve((reader.result as string) || '');
      reader.onerror = () => reject(new Error('FileReader 실패'));
      reader.readAsText(file, 'utf-8');
    });
    return { text, method: 'FileReader', bytes: text.length };
  };

  const handleFile = async (file: File) => {
    setError(null);
    setDwgWarning(false);
    setFileName(file.name);

    const ext = file.name.split('.').pop()?.toLowerCase();
    if (ext === 'dwg') {
      setDwgWarning(true);
      return;
    }

    const sizeKB = Math.round(file.size / 1024);
    try {
      const { text, method, bytes } = await readFileAsText(file);

      if (!text || text.trim().length === 0) {
        throw new Error(`파일 내용 없음 (size=${sizeKB}KB, method=${method}, bytes=${bytes})`);
      }

      // 진단: DXF의 첫 몇 줄이 제대로 왔는지 확인
      const head = text.slice(0, 200).replace(/\s+/g, ' ').trim();
      const hasSection = text.includes('SECTION');
      const hasEof = text.includes('EOF');

      try {
        const result = parseDxf(text);
        setParsed(result);
        setFileText(text);
        const init: LayerMapping = {};
        for (const l of result.layers) init[l.name] = l.autoMapped;
        setMapping(init);
      } catch (parseErr) {
        const pm = parseErr instanceof Error ? parseErr.message : String(parseErr);
        throw new Error(
          `파싱 실패 [${pm}] | ${sizeKB}KB, ${bytes}b, ${method}, SEC=${hasSection}, EOF=${hasEof} | head="${head.slice(0, 80)}"`
        );
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      setError(`DXF 오류: ${msg}`);
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

      const floorPlan = buildFloorPlan(parsed, mapping, buildingType);
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
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const err: any = upload.error;
        setError(
          `파일 업로드 실패: ${err.message} | name=${err.name ?? '?'} | status=${err.statusCode ?? err.status ?? '?'} | bucket=iso-dxf-files | path=${path}`
        );
        console.error('[DXF Upload Error]', err);
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
            <p className="font-medium text-sm">도면 파일 업로드</p>
            <p className="text-xs text-neutral-500 mt-1">.dxf 또는 .dwg 파일을 선택하세요</p>
          </div>
          <input
            type="file"
            accept=".dxf,.dwg"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) handleFile(f);
            }}
          />
          {error && <p className="text-xs text-red-600">{error}</p>}
        </label>

        {dwgWarning && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
            <div className="bg-white rounded-2xl shadow-xl max-w-sm w-full mx-4 p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-2">
                  <FileWarning size={20} className="text-amber-500" />
                  <h3 className="font-bold text-sm">DWG 파일 변환 필요</h3>
                </div>
                <button onClick={() => setDwgWarning(false)} className="p-1 hover:bg-neutral-100 rounded-lg">
                  <X size={16} />
                </button>
              </div>

              <p className="text-xs text-neutral-600 mb-4">
                DWG 파일은 직접 읽을 수 없습니다. DXF로 변환 후 업로드해주세요.
              </p>

              <div className="space-y-3 mb-5">
                <div className="bg-neutral-50 rounded-lg p-3">
                  <p className="text-xs font-semibold mb-1">방법 1: CAD에서 변환</p>
                  <p className="text-[11px] text-neutral-500">파일 → 다른 이름으로 저장 → DXF 선택</p>
                </div>
                <div className="bg-neutral-50 rounded-lg p-3">
                  <p className="text-xs font-semibold mb-1">방법 2: 온라인 변환</p>
                  <div className="flex flex-col gap-1.5 mt-1.5">
                    <a
                      href="https://cloudconvert.com/dwg-to-dxf"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1.5 text-[11px] text-blue-600 hover:underline"
                    >
                      <ExternalLink size={12} /> CloudConvert (무료)
                    </a>
                    <a
                      href="https://convertio.co/kr/dwg-dxf/"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1.5 text-[11px] text-blue-600 hover:underline"
                    >
                      <ExternalLink size={12} /> Convertio (무료)
                    </a>
                  </div>
                </div>
              </div>

              <button
                onClick={() => setDwgWarning(false)}
                className="w-full rounded-lg bg-neutral-900 text-white py-2 text-sm font-medium"
              >
                확인
              </button>
            </div>
          </div>
        )}
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

        <div className="flex items-center gap-3 rounded-2xl border border-neutral-200 bg-white px-4 py-3">
          <Building2 size={16} className="text-neutral-500" />
          <div className="flex-1">
            <p className="text-sm font-medium">건물 유형</p>
            <p className="text-xs text-neutral-500">유형에 따라 기본 마감재와 방 이름이 달라집니다</p>
          </div>
          <select
            value={buildingType}
            onChange={(e) => setBuildingType(e.target.value as BuildingType)}
            className="rounded-lg border border-neutral-300 px-2 py-1.5 text-sm bg-white"
          >
            {BUILDING_TYPES.map((bt) => (
              <option key={bt.value} value={bt.value}>{bt.label}</option>
            ))}
          </select>
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
