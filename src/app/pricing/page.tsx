import { createClient } from '@/lib/supabase/server';
import { PricingSection } from '@/components/landing/PricingSection';
import { PublicLayout } from '@/components/layout/PublicLayout';
import type { PricingPlan } from '@/types/pricing';

export const dynamic = 'force-dynamic';

export default async function PricingPage() {
  const supabase = await createClient();
  const { data } = await supabase
    .from('iso_pricing_plans')
    .select('*')
    .eq('is_active', true)
    .order('sort_order');
  const plans = (data ?? []) as PricingPlan[];

  return (
    <PublicLayout>
      <PricingSection plans={plans} />
    </PublicLayout>
  );
}
