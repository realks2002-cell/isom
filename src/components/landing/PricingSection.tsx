import { Check } from 'lucide-react';
import Link from 'next/link';
import type { PricingPlan } from '@/types/pricing';

interface Props {
  plans: PricingPlan[];
}

export function PricingSection({ plans }: Props) {
  if (plans.length === 0) return null;

  return (
    <section id="pricing" className="bg-white py-20">
      <div className="mx-auto max-w-6xl px-4">
        <div className="text-center mb-12">
          <p className="text-[11px] font-bold uppercase tracking-widest text-neutral-400">
            Pricing
          </p>
          <h2 className="mt-2 text-3xl font-black text-neutral-900 md:text-4xl">
            Simple, Transparent Pricing
          </h2>
          <p className="mt-3 text-sm text-neutral-500">
            도면 한 장으로 시작하세요. 언제든 업그레이드 가능합니다.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          {plans.map((plan) => (
            <div
              key={plan.id}
              className={`relative rounded-2xl border p-6 flex flex-col ${
                plan.is_popular
                  ? 'border-neutral-900 shadow-xl ring-1 ring-neutral-900'
                  : 'border-neutral-200 shadow-sm'
              }`}
            >
              {plan.is_popular && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-neutral-900 px-3 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white">
                  Most Popular
                </span>
              )}
              <div>
                <h3 className="text-lg font-bold">{plan.name}</h3>
              </div>
              <div className="mt-4">
                <span className="text-3xl font-black">
                  {plan.price === 0 ? '무료' : `₩${plan.price.toLocaleString()}`}
                </span>
                {plan.price > 0 && (
                  <span className="text-sm text-neutral-500">/월</span>
                )}
              </div>
              <p className="mt-2 text-xs text-neutral-500">
                AI 렌더링 월 {plan.render_limit}회
                {plan.project_limit > 0 ? ` · 프로젝트 ${plan.project_limit}개` : ' · 무제한 프로젝트'}
              </p>
              <ul className="mt-6 flex-1 space-y-2.5">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-start gap-2 text-xs text-neutral-700">
                    <Check size={14} className="mt-0.5 shrink-0 text-emerald-500" />
                    {f}
                  </li>
                ))}
              </ul>
              <Link
                href="/login"
                className={`mt-6 block rounded-lg py-2.5 text-center text-sm font-bold ${
                  plan.is_popular
                    ? 'bg-neutral-900 text-white hover:bg-neutral-800'
                    : 'border border-neutral-300 text-neutral-700 hover:bg-neutral-50'
                }`}
              >
                {plan.name} 시작
              </Link>
            </div>
          ))}
        </div>

        <p className="mt-8 text-center text-[11px] text-neutral-400">
          모든 요금제는 VAT 별도입니다. 연간 결제 시 20% 할인.
        </p>
      </div>
    </section>
  );
}
