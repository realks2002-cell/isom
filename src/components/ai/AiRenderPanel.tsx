'use client';

import { useState, useEffect } from 'react';
import { Sparkles, X, Loader2, Camera as CameraIcon, Share2, Check, History, Download } from 'lucide-react';
import type { FloorPlan } from '@/types/room';
import { captureFloorPlanBase64 } from '@/lib/export';
import type { RenderStyle, FurnitureLevel, LightingStyle } from '@/lib/ai-render-prompts';
import { getDefaultLighting } from '@/lib/ai-render-prompts';
import type { RenderQuality } from '@/lib/ai-render';
import type { BuildingType } from '@/lib/building-types';

const STYLES: { value: RenderStyle; label: string }[] = [
  { value: 'modern', label: '모던' },
  { value: 'classic', label: '클래식' },
  { value: 'minimal', label: '미니멀' },
  { value: 'luxury', label: '럭셔리' },
  { value: 'scandinavian', label: '스칸디' },
  { value: 'clinical', label: '클리니컬' },
  { value: 'cozy', label: '코지' },
];

const FURNITURE_OPTIONS: { value: FurnitureLevel; label: string; desc: string }[] = [
  { value: 'none', label: '없음', desc: '빈 공간' },
  { value: 'minimal', label: '간단', desc: '핵심 가구만' },
  { value: 'full', label: '완전', desc: '방별 풀세트' },
];

interface Props {
  floorPlan: FloorPlan;
  projectId: string;
  buildingType: BuildingType;
  onClose: () => void;
}

export function AiRenderPanel({ floorPlan, projectId, buildingType, onClose }: Props) {
  const [style, setStyle] = useState<RenderStyle>('modern');
  const [quality, setQuality] = useState<RenderQuality>('fast');
  const [furniture, setFurniture] = useState<FurnitureLevel>('none');
  const [lighting, setLighting] = useState<LightingStyle>(getDefaultLighting(buildingType));
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resultUrl, setResultUrl] = useState<string | null>(null);
  const [sourceUrl, setSourceUrl] = useState<string | null>(null);
  const [compare, setCompare] = useState(50);
  const [remaining, setRemaining] = useState<number | null>(null);
  const [referencePhoto, setReferencePhoto] = useState<string | null>(null);
  const [renderId, setRenderId] = useState<string | null>(null);
  const [shareUrl, setShareUrl] = useState<string | null>(null);
  const [sharing, setSharing] = useState(false);
  const [refinement, setRefinement] = useState('');
  const [refining, setRefining] = useState(false);
  const [tab, setTab] = useState<'new' | 'history'>('new');
  const [historyItems, setHistoryItems] = useState<{ id: string; public_url: string; style: string; quality: string; created_at: string; share_token: string | null }[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  useEffect(() => {
    if (tab !== 'history' || historyItems.length > 0) return;
    setHistoryLoading(true);
    fetch(`/api/renders?projectId=${projectId}`)
      .then((r) => r.json())
      .then((json) => setHistoryItems(json.renders ?? []))
      .catch(() => {})
      .finally(() => setHistoryLoading(false));
  }, [tab, projectId, historyItems.length]);

  const captureReferencePhoto = async () => {
    try {
      const { isNative } = await import('@/lib/platform');
      if (isNative()) {
        const { Camera, CameraResultType, CameraSource } = await import('@capacitor/camera');
        const photo = await Camera.getPhoto({
          quality: 70,
          resultType: CameraResultType.DataUrl,
          source: CameraSource.Prompt,
          promptLabelHeader: '현장 사진',
          promptLabelPhoto: '앨범에서 선택',
          promptLabelPicture: '카메라로 촬영',
        });
        if (photo.dataUrl) setReferencePhoto(photo.dataUrl);
      } else {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'image/*';
        input.capture = 'environment';
        input.onchange = () => {
          const file = input.files?.[0];
          if (!file) return;
          const reader = new FileReader();
          reader.onloadend = () => setReferencePhoto(reader.result as string);
          reader.readAsDataURL(file);
        };
        input.click();
      }
    } catch (e) {
      if (!(e as Error)?.message?.toLowerCase?.().includes('cancel')) {
        setError('사진을 가져올 수 없습니다');
      }
    }
  };

  const run = async () => {
    if (!confirm('렌더링 1회가 차감됩니다. 진행할까요?')) return;
    setError(null);
    setLoading(true);
    try {
      const imageBase64 = await captureFloorPlanBase64(floorPlan);
      setSourceUrl(`data:image/png;base64,${imageBase64}`);
      const res = await fetch('/api/ai-render', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId,
          imageBase64,
          rooms: floorPlan.rooms,
          style,
          quality,
          furniture,
          lighting,
          buildingType,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || '렌더링 실패');
      setResultUrl(`data:image/png;base64,${json.imageBase64}`);
      if (json.renderId) setRenderId(json.renderId);
      setShareUrl(null);
      if (typeof json.remaining === 'number') setRemaining(json.remaining);
      try {
        const { isNative } = await import('@/lib/platform');
        if (isNative()) {
          const { Haptics, ImpactStyle } = await import('@capacitor/haptics');
          await Haptics.impact({ style: ImpactStyle.Medium });
        }
      } catch {}
    } catch (e) {
      setError(e instanceof Error ? e.message : '렌더링 실패');
    } finally {
      setLoading(false);
    }
  };

  const handleRefine = async () => {
    if (!refinement.trim() || !resultUrl) return;
    setRefining(true);
    setError(null);
    try {
      // resultUrl에서 base64 추출
      const base64 = resultUrl.split(',')[1];
      const res = await fetch('/api/ai-render', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId,
          imageBase64: base64,
          style,
          quality,
          furniture,
          lighting,
          buildingType,
          refinementPrompt: refinement.trim(),
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || '수정 렌더링 실패');
      setResultUrl(`data:image/png;base64,${json.imageBase64}`);
      if (json.renderId) setRenderId(json.renderId);
      setShareUrl(null);
      setRefinement('');
      if (typeof json.remaining === 'number') setRemaining(json.remaining);
    } catch (e) {
      setError(e instanceof Error ? e.message : '수정 렌더링 실패');
    } finally {
      setRefining(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 flex flex-col">
      <header className="flex items-center justify-between px-4 py-3 bg-neutral-900 text-white">
        <div className="flex items-center gap-3">
          <Sparkles size={18} className="text-yellow-400" />
          <div className="flex gap-1 bg-white/10 rounded-lg p-0.5">
            <button
              onClick={() => setTab('new')}
              className={`px-3 py-1 text-xs font-medium rounded-md ${tab === 'new' ? 'bg-white text-neutral-900' : 'text-white/70'}`}
            >
              새 렌더링
            </button>
            <button
              onClick={() => setTab('history')}
              className={`px-3 py-1 text-xs font-medium rounded-md flex items-center gap-1 ${tab === 'history' ? 'bg-white text-neutral-900' : 'text-white/70'}`}
            >
              <History size={12} /> 히스토리
            </button>
          </div>
        </div>
        <button
          onClick={onClose}
          className="p-1.5 rounded-lg hover:bg-white/10"
          aria-label="닫기"
        >
          <X size={18} />
        </button>
      </header>

      <div className="flex-1 overflow-auto p-4 flex flex-col gap-4 items-center">
        {/* 히스토리 탭 */}
        {tab === 'history' && (
          <div className="w-full max-w-4xl">
            {historyLoading ? (
              <div className="flex items-center justify-center py-12 text-white">
                <Loader2 size={24} className="animate-spin" />
              </div>
            ) : historyItems.length === 0 ? (
              <p className="text-center text-sm text-white/50 py-12">렌더링 히스토리가 없습니다</p>
            ) : (
              <div className="grid gap-4 grid-cols-2 md:grid-cols-3">
                {historyItems.map((item) => (
                  <div key={item.id} className="rounded-xl overflow-hidden bg-neutral-800 border border-neutral-700">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={item.public_url} alt="" className="w-full aspect-[4/3] object-cover" />
                    <div className="p-3">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-[10px] text-neutral-400">
                          {item.style} · {item.quality}
                        </span>
                        <span className="text-[10px] text-neutral-500">
                          {new Date(item.created_at).toLocaleDateString('ko')}
                        </span>
                      </div>
                      <div className="flex gap-1.5">
                        <a
                          href={item.public_url}
                          download="render.png"
                          className="flex-1 flex items-center justify-center gap-1 rounded-md bg-white/10 py-1 text-[10px] text-white hover:bg-white/20"
                        >
                          <Download size={10} /> 저장
                        </a>
                        <button
                          onClick={async () => {
                            if (item.share_token) {
                              const url = `${window.location.origin}/share/${item.share_token}`;
                              await navigator.clipboard.writeText(url);
                              return;
                            }
                            const res = await fetch('/api/share', {
                              method: 'POST',
                              headers: { 'Content-Type': 'application/json' },
                              body: JSON.stringify({ renderId: item.id }),
                            });
                            const json = await res.json();
                            if (json.token) {
                              const url = `${window.location.origin}/share/${json.token}`;
                              await navigator.clipboard.writeText(url);
                              setHistoryItems((prev) =>
                                prev.map((h) => h.id === item.id ? { ...h, share_token: json.token } : h)
                              );
                            }
                          }}
                          className="flex-1 flex items-center justify-center gap-1 rounded-md bg-blue-500/20 py-1 text-[10px] text-blue-300 hover:bg-blue-500/30"
                        >
                          <Share2 size={10} /> 공유
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* 새 렌더링 탭 */}
        {tab === 'new' && !resultUrl && !loading && (
          <div className="w-full max-w-md space-y-4 bg-white rounded-2xl p-5">
            <div>
              <label className="block text-xs font-medium mb-2">스타일</label>
              <div className="grid grid-cols-5 gap-1.5">
                {STYLES.map((s) => (
                  <button
                    key={s.value}
                    onClick={() => setStyle(s.value)}
                    className={`py-2 text-xs font-medium rounded-lg border ${
                      style === s.value
                        ? 'bg-neutral-900 text-white border-neutral-900'
                        : 'bg-white text-neutral-700 border-neutral-200'
                    }`}
                  >
                    {s.label}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium mb-2">가구 배치</label>
              <div className="grid grid-cols-3 gap-1.5">
                {FURNITURE_OPTIONS.map((f) => (
                  <button
                    key={f.value}
                    onClick={() => setFurniture(f.value)}
                    className={`py-2 px-2 text-xs font-medium rounded-lg border ${
                      furniture === f.value
                        ? 'bg-neutral-900 text-white border-neutral-900'
                        : 'bg-white text-neutral-700 border-neutral-200'
                    }`}
                  >
                    <div>{f.label}</div>
                    <div
                      className={`text-[10px] mt-0.5 ${
                        furniture === f.value ? 'text-white/70' : 'text-neutral-500'
                      }`}
                    >
                      {f.desc}
                    </div>
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium mb-2">품질</label>
              <div className="flex gap-2">
                <button
                  onClick={() => setQuality('fast')}
                  className={`flex-1 py-2 text-xs font-medium rounded-lg border ${
                    quality === 'fast'
                      ? 'bg-neutral-900 text-white border-neutral-900'
                      : 'bg-white text-neutral-700 border-neutral-200'
                  }`}
                >
                  빠른 렌더링
                </button>
                <button
                  onClick={() => setQuality('high')}
                  className={`flex-1 py-2 text-xs font-medium rounded-lg border ${
                    quality === 'high'
                      ? 'bg-neutral-900 text-white border-neutral-900'
                      : 'bg-white text-neutral-700 border-neutral-200'
                  }`}
                >
                  고품질
                </button>
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium mb-2">조명</label>
              <div className="flex gap-2">
                <button
                  onClick={() => setLighting('practical')}
                  className={`flex-1 py-2 text-xs font-medium rounded-lg border ${
                    lighting === 'practical'
                      ? 'bg-neutral-900 text-white border-neutral-900'
                      : 'bg-white text-neutral-700 border-neutral-200'
                  }`}
                >
                  실용 조명
                </button>
                <button
                  onClick={() => setLighting('mood')}
                  className={`flex-1 py-2 text-xs font-medium rounded-lg border ${
                    lighting === 'mood'
                      ? 'bg-neutral-900 text-white border-neutral-900'
                      : 'bg-white text-neutral-700 border-neutral-200'
                  }`}
                >
                  무드 조명
                </button>
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium mb-2">현장 사진 (선택)</label>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={captureReferencePhoto}
                  className="flex items-center gap-1.5 rounded-lg border border-neutral-300 bg-white px-3 py-2 text-xs font-medium text-neutral-700 hover:bg-neutral-50"
                >
                  <CameraIcon size={14} /> {referencePhoto ? '다시 촬영' : '사진 찍기'}
                </button>
                {referencePhoto && (
                  <>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={referencePhoto}
                      alt="현장"
                      className="h-10 w-10 rounded-md object-cover border border-neutral-200"
                    />
                    <button
                      type="button"
                      onClick={() => setReferencePhoto(null)}
                      className="text-[11px] text-neutral-500 hover:text-red-600"
                    >
                      제거
                    </button>
                  </>
                )}
              </div>
              <p className="mt-1 text-[10px] text-neutral-500">
                실제 현장 사진을 참고하면 더 정확한 분위기로 렌더링됩니다.
              </p>
            </div>
            {error && (
              <p className="text-xs text-red-600 bg-red-50 rounded-lg px-3 py-2">
                {error}
              </p>
            )}
            <button
              onClick={run}
              className="w-full rounded-lg bg-yellow-500 text-neutral-900 py-2.5 text-sm font-bold hover:bg-yellow-400 flex items-center justify-center gap-1.5"
            >
              <Sparkles size={16} /> 렌더링 시작
            </button>
            <p className="text-[11px] text-neutral-500 text-center">
              5~15초 소요 · 렌더링 1회 차감
            </p>
          </div>
        )}

        {tab === 'new' && loading && (
          <div className="flex flex-col items-center gap-3 text-white">
            <Loader2 size={36} className="animate-spin" />
            <p className="text-sm">렌더링 중입니다... (5~15초)</p>
          </div>
        )}

        {tab === 'new' && resultUrl && sourceUrl && (
          <div className="w-full max-w-4xl space-y-3">
            <div className="relative rounded-2xl overflow-hidden bg-black">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={sourceUrl} alt="원본" className="w-full block" />
              <div
                className="absolute inset-y-0 left-0 overflow-hidden"
                style={{ width: `${compare}%` }}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={resultUrl} alt="렌더링" className="w-full block" />
              </div>
              <div
                className="absolute inset-y-0 w-0.5 bg-white shadow-lg pointer-events-none"
                style={{ left: `${compare}%` }}
              />
            </div>
            <input
              type="range"
              min={0}
              max={100}
              value={compare}
              onChange={(e) => setCompare(parseInt(e.target.value))}
              className="w-full"
            />
            <div className="flex gap-2">
              <a
                href={resultUrl}
                download="ai-render.png"
                className="flex-1 rounded-lg bg-white text-neutral-900 py-2 text-sm font-medium text-center"
              >
                PNG 저장
              </a>
              {renderId && (
                <button
                  disabled={sharing}
                  onClick={async () => {
                    setSharing(true);
                    try {
                      const res = await fetch('/api/share', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ renderId }),
                      });
                      const json = await res.json();
                      if (json.token) {
                        const url = `${window.location.origin}/share/${json.token}`;
                        setShareUrl(url);
                        await navigator.clipboard.writeText(url);
                      }
                    } catch {} finally { setSharing(false); }
                  }}
                  className="flex-1 rounded-lg bg-blue-500 text-white py-2 text-sm font-medium flex items-center justify-center gap-1.5"
                >
                  {shareUrl ? <><Check size={14} /> 복사됨</> : <><Share2 size={14} /> {sharing ? '...' : '공유'}</>}
                </button>
              )}
              <button
                onClick={() => {
                  setResultUrl(null);
                  setSourceUrl(null);
                  setRenderId(null);
                  setShareUrl(null);
                }}
                className="flex-1 rounded-lg border border-white text-white py-2 text-sm font-medium"
              >
                다시 렌더링
              </button>
            </div>
            {shareUrl && (
              <div className="flex items-center gap-2 bg-white/10 rounded-lg px-3 py-2">
                <input
                  readOnly
                  value={shareUrl}
                  className="flex-1 bg-transparent text-[11px] text-white outline-none"
                  onClick={(e) => (e.target as HTMLInputElement).select()}
                />
              </div>
            )}
            {/* 수정 지시 */}
            <div className="flex gap-2">
              <input
                type="text"
                value={refinement}
                onChange={(e) => setRefinement(e.target.value)}
                placeholder="수정 지시 입력 (예: 벽을 더 밝게, 가구 추가)"
                className="flex-1 rounded-lg bg-white/10 border border-white/20 px-3 py-2 text-xs text-white placeholder-white/40 outline-none focus:border-white/50"
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && refinement.trim()) {
                    e.preventDefault();
                    handleRefine();
                  }
                }}
              />
              <button
                onClick={handleRefine}
                disabled={!refinement.trim() || refining}
                className="rounded-lg bg-yellow-500 text-neutral-900 px-4 py-2 text-xs font-bold hover:bg-yellow-400 disabled:opacity-40 flex items-center gap-1.5 shrink-0"
              >
                <Sparkles size={12} /> {refining ? '수정 중...' : '수정 렌더링'}
              </button>
            </div>

            {remaining !== null && (
              <p className="text-[11px] text-white/70 text-center">
                남은 렌더링: {remaining}회 · 수정 렌더링도 1회 차감
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
