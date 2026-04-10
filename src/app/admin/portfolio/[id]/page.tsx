import { redirect, notFound } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { isAdminAuthed } from '@/lib/admin-auth';
import { createAdminClient } from '@/lib/supabase/admin';
import type { PortfolioItem } from '@/types/portfolio';
import { PortfolioForm } from '../PortfolioForm';

export const dynamic = 'force-dynamic';

export default async function EditPortfolioPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  if (!(await isAdminAuthed())) redirect('/admin');
  const { id } = await params;

  const admin = createAdminClient();
  const { data } = await admin
    .from('iso_portfolio_items')
    .select('*')
    .eq('id', id)
    .single();

  if (!data) notFound();
  const item = data as PortfolioItem;

  return (
    <main className="mx-auto w-full max-w-2xl px-4 py-6">
      <header className="mb-5 flex items-center gap-3">
        <Link href="/admin/portfolio" className="rounded-lg p-2 hover:bg-neutral-100">
          <ArrowLeft size={18} />
        </Link>
        <h1 className="text-xl font-bold">포트폴리오 수정</h1>
      </header>
      <div className="rounded-2xl border border-neutral-200 bg-white p-6">
        <PortfolioForm item={item} />
      </div>
    </main>
  );
}
