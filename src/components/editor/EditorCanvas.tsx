'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import type { FloorPlan, PartType, MaterialAssignment, PartitionColor } from '@/types/room';
import type { Material } from '@/types/material';
import type { Selection } from '@/lib/renderer';
import type { CameraState } from '@/types/project';
import { IsometricCanvas } from '@/components/canvas/IsometricCanvas';
import { MaterialPanel } from '@/components/ui/MaterialPanel';
import { ExportButton } from './ExportButton';
import { AiRenderPanel } from '@/components/ai/AiRenderPanel';
import { Sparkles, Palette, Save, Building2, Undo2, ScanEye } from 'lucide-react';
import { BUILDING_TYPES, type BuildingType } from '@/lib/building-types';

type SaveStatus = 'idle' | 'saving' | 'saved' | 'error';

function toAssignment(m: Material): MaterialAssignment {
  return {
    materialId: m.id,
    color: m.colorHex,
    patternType: m.patternType,
    textureUrl: m.textureUrl,
    tileSize: m.tileSizeMm,
  };
}

export function EditorCanvas({
  floorPlan: initial,
  projectId,
  projectName,
  initialCamera,
}: {
  floorPlan: FloorPlan;
  projectId: string;
  projectName: string;
  initialCamera?: CameraState;
}) {
  // 기존 프로젝트 정규화
  // 1) 좌표가 이상하게 큰 경우(mm 단위 등) 자동 축소
  let coordScale = 1;
  let gMinX = Infinity,
    gMinY = Infinity,
    gMaxX = -Infinity,
    gMaxY = -Infinity;
  for (const r of initial.rooms) {
    for (const p of r.points) {
      if (p.x < gMinX) gMinX = p.x;
      if (p.y < gMinY) gMinY = p.y;
      if (p.x > gMaxX) gMaxX = p.x;
      if (p.y > gMaxY) gMaxY = p.y;
    }
  }
  const globalLong = Math.max(gMaxX - gMinX, gMaxY - gMinY);
  if (globalLong > 500) coordScale = 0.001;
  else if (globalLong > 50) coordScale = 0.01;

  const normalized: FloorPlan = {
    ...initial,
    doors: (initial.doors ?? []).map((d) => ({
      ...d,
      position: { x: d.position.x * coordScale, y: d.position.y * coordScale },
    })),
    windows: (initial.windows ?? []).map((w) => ({
      ...w,
      position: { x: w.position.x * coordScale, y: w.position.y * coordScale },
    })),
    internalWalls: (initial.internalWalls ?? []).map((s) => ({
      a: { x: s.a.x * coordScale, y: s.a.y * coordScale },
      b: { x: s.b.x * coordScale, y: s.b.y * coordScale },
    })),
    rooms: initial.rooms.map((r) => {
      const rescaled = {
        ...r,
        points: r.points.map((p) => ({ x: p.x * coordScale, y: p.y * coordScale })),
      };
      const r2 = rescaled;
      let minX = Infinity,
        minY = Infinity,
        maxX = -Infinity,
        maxY = -Infinity;
      for (const p of r2.points) {
        if (p.x < minX) minX = p.x;
        if (p.y < minY) minY = p.y;
        if (p.x > maxX) maxX = p.x;
        if (p.y > maxY) maxY = p.y;
      }
      const shortSide = Math.min(maxX - minX, maxY - minY);
      // 벽 높이는 3m 고정 (폴리곤 축소 후이므로)
      const adaptiveHeight = Math.max(2.7, Math.min(3.5, shortSide * 0.15 || 3));
      return {
        ...r2,
        wallHeight: adaptiveHeight,
        floor: { ...r2.floor, color: '#d4c5a9', patternType: r2.floor?.patternType || 'solid', materialId: r2.floor?.materialId || '' },
        wall: { ...r2.wall, color: '#ece6dc', patternType: r2.wall?.patternType || 'solid', materialId: r2.wall?.materialId || '' },
        baseboard: { ...r2.baseboard, color: '#8b7355', patternType: r2.baseboard?.patternType || 'solid', materialId: r2.baseboard?.materialId || '' },
        door: r2.door?.color
          ? r2.door
          : { materialId: '', color: '#6B4C3B', patternType: 'solid' as const },
      };
    }),
  };
  const [floorPlan, _setFloorPlan] = useState<FloorPlan>(normalized);
  const historyRef = useRef<FloorPlan[]>([]);
  const MAX_UNDO = 30;

  const setFloorPlan = useCallback((updater: FloorPlan | ((prev: FloorPlan) => FloorPlan)) => {
    _setFloorPlan((prev) => {
      historyRef.current = [...historyRef.current.slice(-(MAX_UNDO - 1)), prev];
      return typeof updater === 'function' ? updater(prev) : updater;
    });
  }, []);

  const handleUndo = () => {
    if (historyRef.current.length === 0) return;
    const prev = historyRef.current.pop()!;
    _setFloorPlan(prev);
    isDirty.current = true;
    scheduleSave();
  };

  const [analyzing, setAnalyzing] = useState(false);
  const [analyzeMsg, setAnalyzeMsg] = useState<string | null>(null);

  const handleAnalyzePhoto = async (applyTo: 'current' | 'all') => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = async () => {
      const file = input.files?.[0];
      if (!file) return;
      setAnalyzing(true);
      setAnalyzeMsg('사진 분석 중...');
      try {
        const reader = new FileReader();
        const base64 = await new Promise<string>((resolve) => {
          reader.onloadend = () => {
            const result = reader.result as string;
            resolve(result.split(',')[1]);
          };
          reader.readAsDataURL(file);
        });

        const res = await fetch('/api/ai-analyze', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ imageBase64: base64 }),
        });
        const json = await res.json();
        if (!res.ok) throw new Error(json.error);

        const { materials } = json;
        isDirty.current = true;
        setFloorPlan((prev) => ({
          ...prev,
          rooms: prev.rooms.map((r) => {
            if (applyTo === 'current' && r.id !== selection?.roomId) return r;
            return {
              ...r,
              floor: { ...r.floor, color: materials.floor.color, patternType: materials.floor.patternType },
              wall: { ...r.wall, color: materials.wall.color, patternType: materials.wall.patternType },
              baseboard: { ...r.baseboard, color: materials.baseboard.color, patternType: materials.baseboard.patternType },
              door: { ...r.door, color: materials.door.color, patternType: materials.door.patternType },
            };
          }),
        }));
        scheduleSave();
        const desc = `바닥: ${materials.floor.description}, 벽: ${materials.wall.description}`;
        setAnalyzeMsg(`✅ 적용 완료 — ${desc}`);
        setTimeout(() => setAnalyzeMsg(null), 4000);
      } catch (e) {
        setAnalyzeMsg(`❌ ${e instanceof Error ? e.message : '분석 실패'}`);
        setTimeout(() => setAnalyzeMsg(null), 3000);
      } finally {
        setAnalyzing(false);
      }
    };
    input.click();
  };

  const [selection, setSelection] = useState<Selection | null>(null);
  const [status, setStatus] = useState<SaveStatus>('idle');
  const [aiOpen, setAiOpen] = useState(false);
  const [buildingType, setBuildingType] = useState<BuildingType>(
    (normalized.buildingType as BuildingType) || 'apartment'
  );

  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const statusTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isDirty = useRef(false);
  const latestPlan = useRef(floorPlan);
  const latestCamera = useRef<CameraState | undefined>(initialCamera);
  const mountedRef = useRef(true);

  // render-phase mutation 대신 effect로 (H3)
  useEffect(() => {
    latestPlan.current = floorPlan;
  }, [floorPlan]);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const initCam =
    initialCamera && typeof initialCamera.zoom === 'number'
      ? { x: initialCamera.offsetX, y: initialCamera.offsetY, zoom: initialCamera.zoom, rotation: initialCamera.rotation ?? 0 }
      : undefined;

  const selectedRoom = floorPlan.rooms.find((r) => r.id === selection?.roomId);

  const safeSetStatus = useCallback((s: SaveStatus) => {
    if (mountedRef.current) setStatus(s);
  }, []);

  const thumbSent = useRef(false);
  const captureThumbnail = useCallback(() => {
    if (thumbSent.current) return;
    const canvas = document.querySelector('canvas') as HTMLCanvasElement | null;
    if (!canvas) return;
    thumbSent.current = true;
    try {
      const dataUrl = canvas.toDataURL('image/jpeg', 0.6);
      fetch(`/api/iso-projects/${projectId}/thumbnail`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ dataUrl }),
      }).catch(() => {});
    } catch {
      // ignore
    }
    // 30초 후 다시 가능
    setTimeout(() => { thumbSent.current = false; }, 30000);
  }, [projectId]);

  const flush = useCallback(
    async (useKeepalive = false) => {
      if (!isDirty.current) return;
      isDirty.current = false;
      safeSetStatus('saving');

      const payload = JSON.stringify({
        rooms_data: latestPlan.current,
        camera_state: latestCamera.current ?? {},
      });

      try {
        if (useKeepalive) {
          // 페이지 이탈 시: fetch keepalive로 네트워크 보장
          await fetch(`/api/iso-projects/${projectId}/save`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: payload,
            keepalive: true,
          });
        } else {
          const res = await fetch(`/api/iso-projects/${projectId}/save`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: payload,
          });
          if (!res.ok) throw new Error('save failed');
        }
        safeSetStatus('saved');
        captureThumbnail();
        if (statusTimer.current) clearTimeout(statusTimer.current);
        statusTimer.current = setTimeout(() => {
          if (mountedRef.current) setStatus((s) => (s === 'saved' ? 'idle' : s));
        }, 1500);
      } catch {
        isDirty.current = true;
        safeSetStatus('error');
      }
    },
    [projectId, safeSetStatus]
  );

  const scheduleSave = useCallback(() => {
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => flush(false), 600);
  }, [flush]);

  // visibilitychange: 탭 숨김 시 keepalive flush
  useEffect(() => {
    const onHide = () => {
      if (document.visibilityState === 'hidden' && isDirty.current) {
        flush(true);
      }
    };
    document.addEventListener('visibilitychange', onHide);
    return () => document.removeEventListener('visibilitychange', onHide);
  }, [flush]);

  // unmount cleanup: 타이머 정리 + 미저장 flush
  useEffect(() => {
    return () => {
      if (saveTimer.current) clearTimeout(saveTimer.current);
      if (statusTimer.current) clearTimeout(statusTimer.current);
      if (isDirty.current) flush(true);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Ctrl+Z 단축키
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'z' && !e.shiftKey) {
        e.preventDefault();
        handleUndo();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [scheduleSave]); // eslint-disable-line react-hooks/exhaustive-deps

  // beforeunload 경고
  useEffect(() => {
    const handler = (e: BeforeUnloadEvent) => {
      if (isDirty.current || status === 'saving') {
        e.preventDefault();
        e.returnValue = '';
      }
    };
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, [status]);

  const handleBuildingTypeChange = (bt: BuildingType) => {
    setBuildingType(bt);
    isDirty.current = true;
    setFloorPlan((prev) => ({ ...prev, buildingType: bt }));
    scheduleSave();
  };

  const handleWallHeight = (height: number) => {
    isDirty.current = true;
    setFloorPlan((prev) => ({
      ...prev,
      rooms: prev.rooms.map((r) => ({ ...r, wallHeight: height })),
    }));
    scheduleSave();
  };

  const handlePartitionColor = (color: PartitionColor) => {
    isDirty.current = true;
    setFloorPlan((prev) => ({ ...prev, partitionColor: color }));
    scheduleSave();
  };

  const hasPartitions = floorPlan.internalWalls?.some((w) => w.partition) ?? false;

  const handleRename = (roomId: string, name: string) => {
    isDirty.current = true;
    setFloorPlan((prev) => ({
      ...prev,
      rooms: prev.rooms.map((r) => (r.id === roomId ? { ...r, name } : r)),
    }));
    scheduleSave();
  };

  const handleApply = (part: PartType, material: Material) => {
    console.log('[handleApply] part:', part, 'material:', material.name, 'selection:', selection);
    if (!selection) return;
    isDirty.current = true;
    const assign = toAssignment(material);

    if (part === 'wall' && selection.wallIndex !== undefined) {
      // 개별 벽
      setFloorPlan((prev) => ({
        ...prev,
        rooms: prev.rooms.map((r) =>
          r.id === selection.roomId
            ? { ...r, walls: { ...(r.walls ?? {}), [selection.wallIndex!]: assign } }
            : r
        ),
      }));
    } else if (part === 'wall') {
      // 전체 벽 — 개별 오버라이드 초기화
      setFloorPlan((prev) => ({
        ...prev,
        rooms: prev.rooms.map((r) =>
          r.id === selection.roomId
            ? { ...r, wall: assign, walls: undefined }
            : r
        ),
      }));
    } else {
      setFloorPlan((prev) => ({
        ...prev,
        rooms: prev.rooms.map((r) =>
          r.id === selection.roomId ? { ...r, [part]: assign } : r
        ),
      }));
    }
    scheduleSave();
  };

  const handleApplyAll = (part: PartType, material: Material) => {
    isDirty.current = true;
    const assign = toAssignment(material);
    if (part === 'wall') {
      setFloorPlan((prev) => ({
        ...prev,
        rooms: prev.rooms.map((r) => ({ ...r, wall: assign, walls: undefined })),
      }));
    } else {
      setFloorPlan((prev) => ({
        ...prev,
        rooms: prev.rooms.map((r) => ({ ...r, [part]: assign })),
      }));
    }
    scheduleSave();
  };

  // 카메라 변경 핸들러 — 첫 마운트(초기 camera 세팅) 이벤트는 skip (C2, M6)
  const cameraInited = useRef(false);
  const handleCameraChange = useCallback(
    (cam: { x: number; y: number; zoom: number; rotation: number }) => {
      latestCamera.current = { zoom: cam.zoom, offsetX: cam.x, offsetY: cam.y, rotation: cam.rotation };
      if (!cameraInited.current) {
        cameraInited.current = true;
        return;
      }
      isDirty.current = true;
      scheduleSave();
    },
    [scheduleSave]
  );

  const statusLabel =
    status === 'saving'
      ? '저장 중...'
      : status === 'saved'
      ? '저장됨'
      : status === 'error'
      ? '저장 실패 — 변경 시 재시도됩니다'
      : '';

  return (
    <div className="flex-1 flex flex-col relative">
      <div className="absolute top-3 right-3 z-20 flex gap-2">
        <div className="relative">
          <select
            value={buildingType}
            onChange={(e) => handleBuildingTypeChange(e.target.value as BuildingType)}
            className="appearance-none rounded-lg bg-white text-neutral-900 border border-neutral-200 pl-7 pr-3 py-1.5 text-xs font-medium hover:bg-neutral-50 shadow-sm cursor-pointer"
          >
            {BUILDING_TYPES.map((bt) => (
              <option key={bt.value} value={bt.value}>{bt.label}</option>
            ))}
          </select>
          <Building2 size={13} className="absolute left-2 top-1/2 -translate-y-1/2 text-neutral-500 pointer-events-none" />
        </div>
        <button
          onClick={handleUndo}
          disabled={historyRef.current.length === 0}
          className="flex items-center gap-1.5 rounded-lg bg-white text-neutral-900 border border-neutral-200 px-3 py-1.5 text-xs font-medium hover:bg-neutral-50 shadow-sm disabled:opacity-30"
          title="되돌리기 (Undo)"
        >
          <Undo2 size={14} />
        </button>
        <div className="flex items-center gap-1.5 rounded-lg bg-white border border-neutral-200 px-2 py-1 shadow-sm">
          <span className="text-[10px] text-neutral-500">벽</span>
          <input
            type="range"
            min={0.5}
            max={3.5}
            step={0.1}
            value={floorPlan.rooms[0]?.wallHeight ?? 2.4}
            onChange={(e) => handleWallHeight(parseFloat(e.target.value))}
            className="w-14 h-1 accent-neutral-600"
          />
          <span className="text-[10px] text-neutral-500 w-6">{(floorPlan.rooms[0]?.wallHeight ?? 2.4).toFixed(1)}</span>
        </div>
        <button
          onClick={() => flush()}
          disabled={status === 'saving'}
          className="flex items-center gap-1.5 rounded-lg bg-white text-neutral-900 border border-neutral-200 px-3 py-1.5 text-xs font-medium hover:bg-neutral-50 shadow-sm disabled:opacity-50"
        >
          <Save size={14} /> {status === 'saving' ? '저장 중...' : '저장'}
        </button>
        {floorPlan.rooms.length > 0 && (
          <button
            onClick={() =>
              setSelection({ roomId: floorPlan.rooms[0].id, part: 'floor' })
            }
            className="flex items-center gap-1.5 rounded-lg bg-white text-neutral-900 border border-neutral-200 px-3 py-1.5 text-xs font-medium hover:bg-neutral-50 shadow-sm"
          >
            <Palette size={14} /> 마감재
          </button>
        )}
        {hasPartitions && (
          <div className="flex items-center gap-1 rounded-lg bg-white border border-neutral-200 px-2 py-1 shadow-sm">
            <span className="text-[10px] text-neutral-500 mr-1">칸막이</span>
            {([['black', '#1a1a1a'], ['darkgray', '#555'], ['white', '#e0e0e0']] as [PartitionColor, string][]).map(([val, hex]) => (
              <button
                key={val}
                onClick={() => handlePartitionColor(val)}
                title={val === 'black' ? '검정' : val === 'darkgray' ? '짙은 회색' : '흰색'}
                className={`w-5 h-5 rounded-full border-2 ${
                  (floorPlan.partitionColor ?? 'black') === val ? 'border-blue-500' : 'border-neutral-300'
                }`}
                style={{ backgroundColor: hex }}
              />
            ))}
          </div>
        )}
        <button
          onClick={() => handleAnalyzePhoto(selection ? 'current' : 'all')}
          disabled={analyzing}
          className="flex items-center gap-1.5 rounded-lg bg-white text-neutral-900 border border-neutral-200 px-3 py-1.5 text-xs font-medium hover:bg-neutral-50 shadow-sm disabled:opacity-50"
          title="현장 사진으로 마감재 자동 분석"
        >
          <ScanEye size={14} /> {analyzing ? '분석 중...' : 'AI 분석'}
        </button>
        <button
          onClick={() => setAiOpen(true)}
          className="flex items-center gap-1.5 rounded-lg bg-yellow-500 text-neutral-900 px-3 py-1.5 text-xs font-bold hover:bg-yellow-400 shadow-sm"
        >
          <Sparkles size={14} /> 렌더링
        </button>
        <ExportButton floorPlan={floorPlan} projectName={projectName} />
      </div>
      <IsometricCanvas
        floorPlan={floorPlan}
        selection={selection}
        onSelect={(sel) => {
          if (sel) setSelection(sel);
        }}
        initialCamera={initCam}
        onCameraChange={handleCameraChange}
        hideWalls={selection?.part === 'floor'}
      />
      <div className="border-t border-neutral-200 bg-white px-4 py-2 text-xs text-neutral-600 flex items-center justify-between">
        <span>
          {selectedRoom && selection
            ? `${selectedRoom.name} · ${
                {
                  floor: '바닥',
                  wall: '벽',
                  baseboard: '걸레받이',
                  door: '도어',
                }[selection.part]
              }${selection.wallIndex !== undefined ? ` ${selection.wallIndex + 1}면` : ''} 선택됨 — 자재를 적용하세요`
            : '영역을 클릭(또는 탭)하여 선택하세요'}
        </span>
        {analyzeMsg && (
          <span className={analyzeMsg.startsWith('✅') ? 'text-green-600' : analyzeMsg.startsWith('❌') ? 'text-red-600' : 'text-blue-600'}>
            {analyzeMsg}
          </span>
        )}
        {!analyzeMsg && statusLabel && (
          <span
            className={
              status === 'error'
                ? 'text-red-600'
                : status === 'saved'
                ? 'text-green-600'
                : 'text-neutral-400'
            }
          >
            {statusLabel}
          </span>
        )}
      </div>

      {aiOpen && (
        <AiRenderPanel
          floorPlan={floorPlan}
          projectId={projectId}
          buildingType={buildingType}
          onClose={() => setAiOpen(false)}
        />
      )}

      {selectedRoom && selection && (
        <MaterialPanel
          key={selection.roomId}
          room={selectedRoom}
          rooms={floorPlan.rooms}
          initialPart={selection.part}
          wallIndex={selection.wallIndex}
          buildingType={buildingType}
          onApply={handleApply}
          onApplyAll={handleApplyAll}
          onRename={(name) => handleRename(selectedRoom.id, name)}
          onSelectRoom={(roomId) => setSelection({ roomId, part: 'floor' })}
          onPartChange={(part) => setSelection((prev) => prev ? { ...prev, part, wallIndex: undefined } : prev)}
          onClose={() => setSelection(null)}
        />
      )}
    </div>
  );
}
