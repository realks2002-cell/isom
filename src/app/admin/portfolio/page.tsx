import { redirect } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Plus } from 'lucide-react';
import { createAdminClient } from '@/lib/supabase/admin';
import { isAdminAuthed } from '@/lib/admin-auth';
import type { PortfolioItem } from '@/types/portfolio';
import { PortfolioGrid } from './PortfolioGrid';

export const dynamic = 'force-dynamic';

export default async function AdminPortfolioPage() {
  if (!(await isAdminAuthed())) redirect('/admin');

  const admin = createAdminClient();
  const { data } = await admin
    .from('iso_portfolio_items')
    .select('*')
    .order('sort_order', { ascending: false })
    .order('created_at', { ascending: false });

  const items = (data ?? []) as PortfolioItem[];

  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-6">
      <header className="mb-5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link
            href="/admin/users"
            className="rounded-lg p-2 hover:bg-neutral-100"
            aria-label="뒤로"
          >
            <ArrowLeft size={18} />
          </Link>
          <h1 className="text-xl font-bold">포트폴리오 관리</h1>
          <span className="text-xs text-neutral-500">총 {items.length}개 · 드래그로 순서 변경</span>
        </div>
        <Link
          href="/admin/portfolio/new"
          className="inline-flex items-center gap-1.5 rounded-lg bg-neutral-900 px-3 py-1.5 text-xs font-medium text-white hover:bg-neutral-800"
        >
          <Plus size={14} /> 신규 등록
        </Link>
      </header>

      <PortfolioGrid items={items} />
    </main>
  );
}
