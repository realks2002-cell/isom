'use client';

import { useTransition, useRef, useState } from 'react';
import { Trash2, Save, Plus } from 'lucide-react';
import type { PricingPlan } from '@/types/pricing';
import { updatePlan, deletePlan, createPlan } from './actions';

function PlanCard({ plan }: { plan: PricingPlan }) {
  const [pending, start] = useTransition();
  const [msg, setMsg] = useState<string | null>(null);
  const formRef = useRef<HTMLFormElement>(null);

  const handleSave = () => {
    if (!formRef.current) return;
    const fd = new FormData(formRef.current);
    fd.set('id', plan.id);
    start(async () => {
      const res = await updatePlan(fd);
      setMsg('error' in res ? `❌ ${res.error}` : '✅ 저장됨');
      setTimeout(() => setMsg(null), 2000);
    });
  };

  const handleDelete = () => {
    if (!confirm(`"${plan.name}" 요금제를 삭제하시겠습니까?`)) return;
    const fd = new FormData();
    fd.set('id', plan.id);
    start(async () => { await deletePlan(fd); });
  };

  return (
    <form ref={formRef} className="rounded-2xl border border-neutral-200 bg-white p-5 space-y-3">
      <div className="flex items-center justify-between">
        <input
          name="name"
          defaultValue={plan.name}
          className="text-lg font-bold bg-transparent border-b border-transparent focus:border-neutral-300 outline-none"
        />
        <span className="text-[10px] text-neutral-400">{plan.slug}</span>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-[10px] text-neutral-500">월 가격 (원)</label>
          <input
            name="price"
            type="number"
            defaultValue={plan.price}
            className="w-full rounded-lg border border-neutral-200 px-3 py-1.5 text-sm"
          />
        </div>
        <div>
          <label className="text-[10px] text-neutral-500">렌더링 횟수/월</label>
          <input
            name="render_limit"
            type="number"
            defaultValue={plan.render_limit}
            className="w-full rounded-lg border border-neutral-200 px-3 py-1.5 text-sm"
          />
        </div>
        <div>
          <label className="text-[10px] text-neutral-500">프로젝트 제한 (-1=무제한)</label>
          <input
            name="project_limit"
            type="number"
            defaultValue={plan.project_limit}
            className="w-full rounded-lg border border-neutral-200 px-3 py-1.5 text-sm"
          />
        </div>
        <div className="flex items-end gap-4">
          <label className="flex items-center gap-1.5 text-xs">
            <input type="checkbox" name="is_popular" defaultChecked={plan.is_popular} />
            인기
          </label>
          <label className="flex items-center gap-1.5 text-xs">
            <input type="checkbox" name="is_active" defaultChecked={plan.is_active} />
            활성
          </label>
        </div>
      </div>

      <div>
        <label className="text-[10px] text-neutral-500">기능 목록 (줄바꿈 구분)</label>
        <textarea
          name="features"
          defaultValue={plan.features.join('\n')}
          rows={5}
          className="w-full rounded-lg border border-neutral-200 px-3 py-1.5 text-xs leading-relaxed"
        />
      </div>

      {msg && (
        <p className={`text-xs ${msg.startsWith('✅') ? 'text-green-600' : 'text-red-600'}`}>{msg}</p>
      )}

      <div className="flex gap-2">
        <button
          type="button"
          onClick={handleSave}
          disabled={pending}
          className="flex items-center gap-1 rounded-lg bg-neutral-900 px-3 py-1.5 text-xs font-medium text-white hover:bg-neutral-800 disabled:opacity-50"
        >
          <Save size={12} /> 저장
        </button>
        <button
          type="button"
          onClick={handleDelete}
          disabled={pending}
          className="flex items-center gap-1 rounded-lg border border-red-200 px-3 py-1.5 text-xs text-red-600 hover:bg-red-50 disabled:opacity-50"
        >
          <Trash2 size={12} /> 삭제
        </button>
      </div>
    </form>
  );
}

function NewPlanForm() {
  const [open, setOpen] = useState(false);
  const [pending, start] = useTransition();
  const formRef = useRef<HTMLFormElement>(null);

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-1.5 rounded-lg border-2 border-dashed border-neutral-300 px-4 py-8 text-sm text-neutral-500 hover:border-neutral-400 w-full justify-center"
      >
        <Plus size={16} /> 요금제 추가
      </button>
    );
  }

  return (
    <form
      ref={formRef}
      className="rounded-2xl border-2 border-dashed border-neutral-300 bg-white p-5 space-y-3"
    >
      <input name="name" placeholder="요금제 이름" className="w-full rounded-lg border border-neutral-200 px-3 py-1.5 text-sm" />
      <div className="grid grid-cols-2 gap-3">
        <input name="price" type="number" placeholder="월 가격 (원)" className="rounded-lg border border-neutral-200 px-3 py-1.5 text-sm" />
        <input name="render_limit" type="number" placeholder="렌더링 횟수" className="rounded-lg border border-neutral-200 px-3 py-1.5 text-sm" />
        <input name="project_limit" type="number" placeholder="프로젝트 제한 (-1=무제한)" defaultValue={-1} className="rounded-lg border border-neutral-200 px-3 py-1.5 text-sm" />
      </div>
      <textarea name="features" placeholder="기능 목록 (줄바꿈 구분)" rows={4} className="w-full rounded-lg border border-neutral-200 px-3 py-1.5 text-xs" />
      <div className="flex gap-2">
        <button
          type="button"
          disabled={pending}
          onClick={() => {
            if (!formRef.current) return;
            start(async () => {
              await createPlan(new FormData(formRef.current!));
              setOpen(false);
            });
          }}
          className="rounded-lg bg-neutral-900 px-3 py-1.5 text-xs font-medium text-white"
        >
          생성
        </button>
        <button type="button" onClick={() => setOpen(false)} className="rounded-lg border border-neutral-200 px-3 py-1.5 text-xs">
          취소
        </button>
      </div>
    </form>
  );
}

export function PlanEditor({ plans }: { plans: PricingPlan[] }) {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {plans.map((p) => (
        <PlanCard key={p.id} plan={p} />
      ))}
      <NewPlanForm />
    </div>
  );
}
