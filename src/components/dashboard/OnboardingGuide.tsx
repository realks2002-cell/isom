'use client';

import { useState } from 'react';
import { X, Upload, Palette, Sparkles, Share2 } from 'lucide-react';

const STEPS = [
  { icon: Upload, title: 'DXF/DWG 업로드', desc: '도면 파일을 업로드하면 자동으로 3D 이소메트릭 뷰가 생성됩니다.' },
  { icon: Palette, title: '마감재 적용', desc: '벽, 바닥, 걸레받이에 원하는 마감재를 선택하세요. 실시간 반영.' },
  { icon: Sparkles, title: 'AI 렌더링', desc: '포토리얼리스틱 3D 이미지를 AI가 자동 생성합니다.' },
  { icon: Share2, title: '공유 & 내보내기', desc: 'PNG로 저장하거나 고객에게 링크를 전달하세요.' },
];

export function OnboardingGuide() {
  const [visible, setVisible] = useState(true);
  if (!visible) return null;

  return (
    <div className="mb-6 rounded-2xl border border-blue-200 bg-gradient-to-r from-blue-50 to-indigo-50 p-5 relative">
      <button
        onClick={() => setVisible(false)}
        className="absolute right-3 top-3 p-1 rounded-lg hover:bg-white/50"
      >
        <X size={16} className="text-neutral-400" />
      </button>
      <h3 className="text-sm font-bold text-neutral-900 mb-1">ISOPLAN 3D에 오신 걸 환영합니다</h3>
      <p className="text-xs text-neutral-500 mb-4">4단계로 인테리어 시뮬레이션을 완성하세요</p>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {STEPS.map((step, i) => (
          <div key={i} className="rounded-xl bg-white p-3 shadow-sm">
            <div className="flex items-center gap-2 mb-1.5">
              <div className="flex items-center justify-center w-6 h-6 rounded-full bg-blue-100 text-blue-600 text-[10px] font-bold">
                {i + 1}
              </div>
              <step.icon size={14} className="text-blue-600" />
            </div>
            <p className="text-xs font-semibold">{step.title}</p>
            <p className="text-[10px] text-neutral-500 mt-0.5 leading-relaxed">{step.desc}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
