import { Zap, Layers, Smartphone, Infinity as InfinityIcon } from 'lucide-react';

const items = [
  {
    icon: Zap,
    title: 'Real-time Engine',
    desc: 'Three.js 도, WebGL 도 아닙니다. Canvas 2D 기반 자체 엔진으로 자재 변경이 즉시 반영됩니다.',
  },
  {
    icon: Layers,
    title: 'DXF/DWG Auto-Parse',
    desc: '건축사 DXF/DWG 그대로. 벽·문·창·레이어를 자동 인식해 3D 로 세워드립니다.',
  },
  {
    icon: Smartphone,
    title: 'Mobile-First',
    desc: '현장에서, 스마트폰으로, 고객 앞에서 실시간 제안. 설치 없이 브라우저만 있으면 됩니다.',
  },
  {
    icon: InfinityIcon,
    title: '9 Pattern Types',
    desc: 'Tile · Wood · Herringbone · Marble · Terrazzo · Concrete · Brick · Subway · Solid.',
  },
];

export function LibraryBar() {
  return (
    <section id="engine" className="border-b border-neutral-200 bg-neutral-50">
      <div className="mx-auto max-w-[1280px] px-6 py-16">
        <div className="mb-10 text-center">
          <p className="mb-2 text-[11px] font-bold uppercase tracking-[0.25em] text-[#d43e76]">
            About the Engine
          </p>
          <h2 className="text-3xl font-black tracking-tight text-neutral-900">
            Why ISOPLAN 3D
          </h2>
        </div>
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {items.map(({ icon: Icon, title, desc }) => (
            <div key={title} className="border-t-2 border-neutral-900 pt-5">
              <Icon size={22} className="mb-4 text-[#d43e76]" />
              <h3 className="text-base font-black tracking-tight text-neutral-900">
                {title}
              </h3>
              <p className="mt-2 text-[13px] leading-relaxed text-neutral-600">
                {desc}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
