'use client';

import { useState } from 'react';
import { Sparkles, X, Loader2, Camera as CameraIcon } from 'lucide-react';
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

  return (
    <div className="fixed inset-0 z-50 bg-black/70 flex flex-col">
      <header className="flex items-center justify-between px-4 py-3 bg-neutral-900 text-white">
        <div className="flex items-center gap-2">
          <Sparkles size={18} className="text-yellow-400" />
          <h2 className="font-bold text-sm">포토리얼 렌더링</h2>
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
        {!resultUrl && !loading && (
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

        {loading && (
          <div className="flex flex-col items-center gap-3 text-white">
            <Loader2 size={36} className="animate-spin" />
            <p className="text-sm">렌더링 중입니다... (5~15초)</p>
          </div>
        )}

        {resultUrl && sourceUrl && (
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
              <button
                onClick={() => {
                  setResultUrl(null);
                  setSourceUrl(null);
                }}
                className="flex-1 rounded-lg border border-white text-white py-2 text-sm font-medium"
              >
                다시 렌더링
              </button>
            </div>
            {remaining !== null && (
              <p className="text-[11px] text-white/70 text-center">
                남은 렌더링: {remaining}회
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
