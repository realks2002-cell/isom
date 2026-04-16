import { redirect } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { createAdminClient } from '@/lib/supabase/admin';
import { isAdminAuthed } from '@/lib/admin-auth';
import type { PricingPlan } from '@/types/pricing';
import { PlanEditor } from './PlanEditor';

export const dynamic = 'force-dynamic';

export default async function AdminPricingPage() {
  if (!(await isAdminAuthed())) redirect('/admin');

  const admin = createAdminClient();
  const { data } = await admin
    .from('iso_pricing_plans')
    .select('*')
    .order('sort_order');

  const plans = (data ?? []) as PricingPlan[];

  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-6">
      <header className="mb-5 flex items-center gap-3">
        <Link href="/admin/users" className="rounded-lg p-2 hover:bg-neutral-100" aria-label="뒤로">
          <ArrowLeft size={18} />
        </Link>
        <h1 className="text-xl font-bold">요금제 관리</h1>
        <span className="text-xs text-neutral-500">총 {plans.length}개</span>
      </header>

      <PlanEditor plans={plans} />
    </main>
  );
}
