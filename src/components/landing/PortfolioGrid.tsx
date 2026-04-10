import { createClient } from '@/lib/supabase/server';
import type { PortfolioItem } from '@/types/portfolio';
import { Layers } from 'lucide-react';

export async function PortfolioGrid() {
  const supabase = await createClient();
  const { data } = await supabase
    .from('iso_portfolio_items')
    .select('*')
    .eq('is_active', true)
    .order('sort_order', { ascending: false })
    .order('created_at', { ascending: false })
    .range(1, 12);

  const items = (data ?? []) as PortfolioItem[];

  // Collect unique tags for the ribbon
  const tagSet = new Set<string>();
  items.forEach((i) => i.tags.forEach((t) => tagSet.add(t)));
  const tags = Array.from(tagSet).slice(0, 8);

  return (
    <section id="showcases" className="border-b border-neutral-200 bg-white">
      <div className="mx-auto max-w-[1280px] px-6 py-16">
        <div className="mb-8 flex items-end justify-between border-b border-neutral-900 pb-4">
          <div>
            <p className="mb-1 text-[11px] font-bold uppercase tracking-[0.25em] text-[#d43e76]">
              Latest
            </p>
            <h2 className="text-3xl font-black tracking-tight text-neutral-900">
              Showcases
            </h2>
          </div>
          <a
            href="#"
            className="text-[12px] font-bold uppercase tracking-wider text-neutral-700 hover:text-[#d43e76]"
          >
            View all →
          </a>
        </div>

        {tags.length > 0 && (
          <div className="mb-10 flex flex-wrap items-center gap-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-neutral-400">
              Filter:
            </span>
            <button className="border border-neutral-900 bg-neutral-900 px-3 py-1 text-[11px] font-semibold uppercase tracking-wider text-white">
              All
            </button>
            {tags.map((t) => (
              <button
                key={t}
                className="border border-neutral-300 bg-white px-3 py-1 text-[11px] font-semibold uppercase tracking-wider text-neutral-700 hover:border-neutral-900"
              >
                {t}
              </button>
            ))}
          </div>
        )}

        {items.length === 0 ? (
          <div className="border border-dashed border-neutral-300 bg-white p-16 text-center text-sm text-neutral-500">
            아직 등록된 쇼케이스가 없습니다.
          </div>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 md:grid-cols-3">
            {items.map((item) => (
              <article key={item.id} className="group cursor-pointer">
                <div className="relative aspect-[4/3] overflow-hidden bg-neutral-100">
                  {item.thumbnail_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={item.thumbnail_url}
                      alt={item.title}
                      className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.04]"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center text-neutral-300">
                      <Layers size={32} />
                    </div>
                  )}
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
