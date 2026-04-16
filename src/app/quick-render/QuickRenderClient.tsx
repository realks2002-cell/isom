'use client';

import { useState } from 'react';
import { Upload, Sparkles, Loader2, Download, Share2, Check, ScanEye } from 'lucide-react';
import type { RenderStyle, FurnitureLevel, LightingStyle } from '@/lib/ai-render-prompts';
import { getDefaultLighting } from '@/lib/ai-render-prompts';
import type { RenderQuality } from '@/lib/ai-render';
import { BUILDING_TYPES, type BuildingType } from '@/lib/building-types';

const STYLES: { value: RenderStyle; label: string }[] = [
  { value: 'modern', label: '모던' },
  { value: 'classic', label: '클래식' },
  { value: 'minimal', label: '미니멀' },
  { value: 'luxury', label: '럭셔리' },
  { value: 'scandinavian', label: '스칸디' },
  { value: 'clinical', label: '클리니컬' },
  { value: 'cozy', label: '코지' },
];

const FURNITURE_OPTIONS: { value: FurnitureLevel; label: string }[] = [
  { value: 'none', label: '없음' },
  { value: 'minimal', label: '간단' },
  { value: 'full', label: '완전' },
];

export function QuickRenderClient() {
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageBase64, setImageBase64] = useState<string | null>(null);
  const [buildingType, setBuildingType] = useState<BuildingType>('apartment');
  const [style, setStyle] = useState<RenderStyle>('modern');
  const [quality, setQuality] = useState<RenderQuality>('fast');
  const [furniture, setFurniture] = useState<FurnitureLevel>('none');
  const [lighting, setLighting] = useState<LightingStyle>('mood');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resultUrl, setResultUrl] = useState<string | null>(null);
  const [renderId, setRenderId] = useState<string | null>(null);
  const [shareUrl, setShareUrl] = useState<string | null>(null);
  const [conceptImage, setConceptImage] = useState<string | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [analyzeMsg, setAnalyzeMsg] = useState<string | null>(null);
  const [refinement, setRefinement] = useState('');
  const [refining, setRefining] = useState(false);

  const handleImage = (file: File) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const dataUrl = reader.result as string;
      setImagePreview(dataUrl);
      setImageBase64(dataUrl.split(',')[1]);
      setResultUrl(null);
      setError(null);
    };
    reader.readAsDataURL(file);
  };

  const handleBuildingType = (bt: BuildingType) => {
    setBuildingType(bt);
    setLighting(getDefaultLighting(bt));
  };

  const handleRender = async () => {
    if (!imageBase64) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/ai-render', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageBase64,
          style,
          quality,
          furniture,
          lighting,
          buildingType,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error);
      setResultUrl(`data:image/png;base64,${json.imageBase64}`);
      if (json.renderId) setRenderId(json.renderId);
      setShareUrl(null);
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
      const base64 = resultUrl.split(',')[1];
      const res = await fetch('/api/ai-render', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
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
      if (!res.ok) throw new Error(json.error);
      setResultUrl(`data:image/png;base64,${json.imageBase64}`);
      if (json.renderId) setRenderId(json.renderId);
      setShareUrl(null);
      setRefinement('');
    } catch (e) {
      setError(e instanceof Error ? e.message : '수정 렌더링 실패');
    } finally {
      setRefining(false);
    }
  };

  const handleConceptImage = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = async () => {
      const file = input.files?.[0];
      if (!file) return;
      setAnalyzing(true);
      setAnalyzeMsg('이미지 분석 중...');
      try {
        const reader = new FileReader();
        const base64 = await new Promise<string>((resolve) => {
          reader.onloadend = () => resolve((reader.result as string).split(',')[1]);
          reader.readAsDataURL(file);
        });
        setConceptImage(`data:image/jpeg;base64,${base64}`);

        const res = await fetch('/api/ai-analyze', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ imageBase64: base64 }),
        });
        const json = await res.json();
        if (!res.ok) throw new Error(json.error);

        const { materials } = json;
        setAnalyzeMsg(`✅ 바닥: ${materials.floor.description}, 벽: ${materials.wall.description}`);
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

  return (
    <div className="mx-auto max-w-4xl px-4 py-6">
      <div className="mb-6">
        <h1 className="text-xl font-bold">Quick Render</h1>
        <p className="text-xs text-neutral-500">평면도 이미지 → AI 포토리얼 렌더링</p>
      </div>
        <div className="grid gap-6 md:grid-cols-2">
          {/* 왼쪽: 이미지 업로드 + 설정 */}
          <div className="space-y-4">
            {/* 이미지 업로드 */}
            <div
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                e.preventDefault();
                const file = e.dataTransfer.files[0];
                if (file) handleImage(file);
              }}
              className="relative overflow-hidden rounded-2xl border-2 border-dashed border-neutral-300 bg-white"
            >
              {imagePreview ? (
                <div className="relative">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={imagePreview} alt="업로드된 이미지" className="w-full" />
                  <button
                    onClick={() => { setImagePreview(null); setImageBase64(null); setResultUrl(null); }}
                    className="absolute right-2 top-2 rounded-lg bg-black/50 px-2 py-1 text-[11px] text-white hover:bg-black/70"
                  >
                    다시 선택
                  </button>
                </div>
              ) : (
                <label className="flex cursor-pointer flex-col items-center gap-3 p-12">
                  <Upload size={32} className="text-neutral-400" />
                  <div className="text-center">
                    <p className="text-sm font-medium">평면도 이미지 업로드</p>
                    <p className="mt-1 text-xs text-neutral-500">
                      CAD 캡처, 사진, 스케치 — 뭐든 OK
                    </p>
                  </div>
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      const f = e.target.files?.[0];
                      if (f) handleImage(f);
                    }}
                  />
                </label>
              )}
            </div>

            {/* 설정 */}
            <div className="space-y-3 rounded-2xl border border-neutral-200 bg-white p-4">
              <div>
                <label className="text-xs font-medium">건물 유형</label>
                <div className="mt-1.5 flex flex-wrap gap-1.5">
                  {BUILDING_TYPES.map((bt) => (
                    <button
                      key={bt.value}
                      onClick={() => handleBuildingType(bt.value)}
                      className={`rounded-lg px-3 py-1.5 text-xs font-medium border ${
                        buildingType === bt.value
                          ? 'bg-neutral-900 text-white border-neutral-900'
                          : 'bg-white text-neutral-700 border-neutral-200'
                      }`}
                    >
                      {bt.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-xs font-medium">스타일</label>
                <div className="mt-1.5 flex flex-wrap gap-1.5">
                  {STYLES.map((s) => (
                    <button
                      key={s.value}
                      onClick={() => setStyle(s.value)}
                      className={`rounded-lg px-3 py-1.5 text-xs font-medium border ${
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

              <div className="flex gap-4">
                <div className="flex-1">
                  <label className="text-xs font-medium">가구</label>
                  <div className="mt-1.5 flex gap-1.5">
                    {FURNITURE_OPTIONS.map((f) => (
                      <button
                        key={f.value}
                        onClick={() => setFurniture(f.value)}
                        className={`flex-1 rounded-lg py-1.5 text-xs font-medium border ${
                          furniture === f.value
                            ? 'bg-neutral-900 text-white border-neutral-900'
                            : 'bg-white text-neutral-700 border-neutral-200'
                        }`}
                      >
                        {f.label}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="flex-1">
                  <label className="text-xs font-medium">조명</label>
                  <div className="mt-1.5 flex gap-1.5">
                    <button
                      onClick={() => setLighting('practical')}
                      className={`flex-1 rounded-lg py-1.5 text-xs font-medium border ${
                        lighting === 'practical'
                          ? 'bg-neutral-900 text-white border-neutral-900'
                          : 'bg-white text-neutral-700 border-neutral-200'
                      }`}
                    >
                      실용
                    </button>
                    <button
                      onClick={() => setLighting('mood')}
                      className={`flex-1 rounded-lg py-1.5 text-xs font-medium border ${
                        lighting === 'mood'
                          ? 'bg-neutral-900 text-white border-neutral-900'
                          : 'bg-white text-neutral-700 border-neutral-200'
                      }`}
                    >
                      무드
                    </button>
                  </div>
                </div>
              </div>

              <div>
                <label className="text-xs font-medium">품질</label>
                <div className="mt-1.5 flex gap-1.5">
                  <button
                    onClick={() => setQuality('fast')}
                    className={`flex-1 rounded-lg py-1.5 text-xs font-medium border ${
                      quality === 'fast'
                        ? 'bg-neutral-900 text-white border-neutral-900'
                        : 'bg-white text-neutral-700 border-neutral-200'
                    }`}
                  >
                    빠른 렌더링
                  </button>
                  <button
                    onClick={() => setQuality('high')}
                    className={`flex-1 rounded-lg py-1.5 text-xs font-medium border ${
                      quality === 'high'
                        ? 'bg-neutral-900 text-white border-neutral-900'
                        : 'bg-white text-neutral-700 border-neutral-200'
                    }`}
                  >
                    고품질
                  </button>
                </div>
              </div>
            </div>

            {/* Concept/현장 이미지 */}
            <div className="flex items-center gap-3">
              <button
                onClick={handleConceptImage}
                disabled={analyzing}
                className="flex items-center gap-1.5 rounded-lg border border-neutral-200 bg-white px-3 py-2 text-xs font-medium hover:bg-neutral-50 disabled:opacity-50"
              >
                <ScanEye size={14} /> {analyzing ? '분석 중...' : '컨셉/현장이미지'}
              </button>
              {conceptImage && (
                <div className="flex items-center gap-2">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={conceptImage} alt="컨셉" className="h-10 w-10 rounded-md object-cover border border-neutral-200" />
                  <button onClick={() => setConceptImage(null)} className="text-[10px] text-neutral-500 hover:text-red-600">제거</button>
                </div>
              )}
            </div>
            {analyzeMsg && (
              <p className={`rounded-lg px-3 py-2 text-xs ${analyzeMsg.startsWith('✅') ? 'bg-green-50 border border-green-200 text-green-700' : 'bg-red-50 border border-red-200 text-red-700'}`}>
                {analyzeMsg}
              </p>
            )}

            {error && (
              <p className="rounded-lg bg-red-50 border border-red-200 px-3 py-2 text-xs text-red-700">{error}</p>
            )}

            <button
              onClick={handleRender}
              disabled={!imageBase64 || loading}
              className="w-full rounded-xl bg-yellow-500 py-3 text-sm font-bold text-neutral-900 hover:bg-yellow-400 disabled:opacity-40 flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 size={16} className="animate-spin" /> 렌더링 중... (5~15초)
                </>
              ) : (
                <>
                  <Sparkles size={16} /> AI 렌더링
                </>
              )}
            </button>
          </div>

          {/* 오른쪽: 결과 */}
          <div>
            {resultUrl ? (
              <div className="space-y-3">
                <div className="overflow-hidden rounded-2xl border border-neutral-200 bg-white">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={resultUrl} alt="렌더링 결과" className="w-full" />
                </div>
                <div className="flex gap-2">
                  <a
                    href={resultUrl}
                    download="quick-render.png"
                    className="flex-1 flex items-center justify-center gap-1.5 rounded-lg bg-neutral-900 py-2 text-xs font-medium text-white hover:bg-neutral-800"
                  >
                    <Download size={14} /> PNG 저장
                  </a>
                  {renderId && (
                    <button
                      onClick={async () => {
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
                        } catch {}
                      }}
                      className="flex-1 flex items-center justify-center gap-1.5 rounded-lg bg-blue-500 py-2 text-xs font-medium text-white hover:bg-blue-400"
                    >
                      {shareUrl ? <><Check size={14} /> 복사됨</> : <><Share2 size={14} /> 공유</>}
                    </button>
                  )}
                  <button
                    onClick={() => { setResultUrl(null); setRenderId(null); setShareUrl(null); setRefinement(''); }}
                    className="flex-1 rounded-lg border border-neutral-200 py-2 text-xs font-medium hover:bg-neutral-50"
                  >
                    다시 렌더링
                  </button>
                </div>

                {/* 수정 지시 */}
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={refinement}
                    onChange={(e) => setRefinement(e.target.value)}
                    placeholder="수정 지시 (예: 벽을 더 밝게, 가구 추가)"
                    className="flex-1 rounded-lg border border-neutral-200 px-3 py-2 text-xs outline-none focus:border-neutral-400"
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
                    className="shrink-0 rounded-lg bg-yellow-500 text-neutral-900 px-3 py-2 text-xs font-bold hover:bg-yellow-400 disabled:opacity-40 flex items-center gap-1.5"
                  >
                    <Sparkles size={12} /> {refining ? '수정 중...' : '수정 렌더링'}
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex h-full items-center justify-center rounded-2xl border border-dashed border-neutral-300 bg-white p-12 text-center">
                <div>
                  <Sparkles size={32} className="mx-auto text-neutral-300" />
                  <p className="mt-3 text-sm text-neutral-500">
                    이미지를 업로드하고
                    <br />
                    렌더링 버튼을 누르세요
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
    </div>
  );
}
