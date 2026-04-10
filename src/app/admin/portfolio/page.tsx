import { redirect } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Plus, Pencil } from 'lucide-react';
import { createAdminClient } from '@/lib/supabase/admin';
import { isAdminAuthed } from '@/lib/admin-auth';
import type { PortfolioItem } from '@/types/portfolio';
import { DeleteButton } from './DeleteButton';

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
          <span className="text-xs text-neutral-500">총 {items.length}개</span>
        </div>
        <Link
          href="/admin/portfolio/new"
          className="inline-flex items-center gap-1.5 rounded-lg bg-neutral-900 px-3 py-1.5 text-xs font-medium text-white hover:bg-neutral-800"
        >
          <Plus size={14} /> 신규 등록
        </Link>
      </header>

      <div className="grid gap-4 md:grid-cols-3">
        {items.length === 0 && (
          <div className="col-span-full rounded-2xl border border-dashed border-neutral-300 bg-white p-10 text-center text-sm text-neutral-500">
            등록된 포트폴리오가 없습니다.
          </div>
        )}
        {items.map((item) => (
          <div
            key={item.id}
            className="overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-sm"
          >
            <div className="relative aspect-[4/3] bg-neutral-100">
              {item.thumbnail_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={item.thumbnail_url}
                  alt={item.title}
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="flex h-full items-center justify-center text-neutral-300">
                  no image
                </div>
              )}
              <span
                className={`absolute left-3 top-3 rounded-full px-2 py-0.5 text-[10px] font-bold ${
                  item.is_active && item.status === 'active'
                    ? 'bg-emerald-500 text-white'
                    : 'bg-neutral-500 text-white'
                }`}
              >
                {item.is_active ? item.status.toUpperCase() : 'HIDDEN'}
              </span>
            </div>
            <div className="p-4">
              <h3 className="truncate text-sm font-bold">{item.title}</h3>
              {item.subtitle && (
                <p className="mt-0.5 truncate text-xs text-neutral-500">
                  {item.subtitle}
                </p>
              )}
              <div className="mt-3 flex items-center gap-2">
                <Link
                  href={`/admin/portfolio/${item.id}`}
                  className="inline-flex items-center gap-1 rounded-lg border border-neutral-300 px-2.5 py-1 text-xs hover:bg-neutral-50"
                >
                  <Pencil size={12} /> 수정
                </Link>
                <DeleteButton id={item.id} />
                <span className="ml-auto text-[11px] text-neutral-400">
                  order {item.sort_order}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </main>
  );
}
