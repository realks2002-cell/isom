import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import type { PortfolioItem } from '@/types/portfolio';

export async function Hero() {
  const supabase = await createClient();
  const { data } = await supabase
    .from('iso_portfolio_items')
    .select('*')
    .eq('is_active', true)
    .order('sort_order', { ascending: false })
    .order('created_at', { ascending: false })
    .limit(1);

  const featured = (data?.[0] ?? null) as PortfolioItem | null;

  return (
    <section className="border-b border-neutral-200 bg-white">
      <div className="mx-auto max-w-[1280px] px-6 py-12 md:py-16">
        <div className="mb-10 text-center">
          <p className="mb-3 text-[11px] font-bold uppercase tracking-[0.3em] text-[#d43e76]">
            In Progress — Now Live
          </p>
          <h1 className="text-4xl font-black leading-[1.05] tracking-tight text-neutral-900 md:text-6xl">
            Everything Starts
            <br />
            with a Single Drawing.
          </h1>
          <p className="mx-auto mt-5 max-w-xl text-sm leading-relaxed text-neutral-600 md:text-base">
            DWG 한 장이면 충분합니다. 자체 Isometric Rendering Engine 이 당신의
            도면을 실시간 3D 시뮬레이션으로 바꿔드립니다.
            <br className="hidden md:block" />
            No 3D software. No 대기. 현장에서 바로.
          </p>
          <div className="mt-7 flex items-center justify-center gap-3">
            <Link
              href="/login?mode=signup"
              className="inline-flex items-center gap-1.5 bg-neutral-900 px-6 py-3 text-[12px] font-bold uppercase tracking-wider text-white hover:bg-[#d43e76]"
            >
              Start Project <ArrowRight size={14} />
            </Link>
            <a
              href="#showcases"
              className="inline-flex items-center border border-neutral-300 bg-white px-6 py-3 text-[12px] font-bold uppercase tracking-wider text-neutral-900 hover:border-neutral-900"
            >
              View Showcases
            </a>
          </div>
        </div>

        {featured && (
          <Link
            id="featured"
            href="/login"
            className="group block border-t border-neutral-200 pt-10"
          >
            <p className="mb-4 text-center text-[10px] font-bold uppercase tracking-[0.25em] text-neutral-400">
              · Featured Showcase ·
            </p>
            <div className="grid items-center gap-8 md:grid-cols-[1.3fr_1fr]">
              <div className="relative aspect-[16/10] overflow-hidden bg-neutral-100">
                {featured.thumbnail_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={featured.thumbnail_url}
                    alt={featured.title}
                    className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.02]"
                  />
                ) : (
                  <div className="flex h-full items-center justify-center text-neutral-300">
                    no image
                  </div>
                )}
              </div>
              <div>
                {featured.tags[0] && (
                  <p className="mb-3 text-[11px] font-bold uppercase tracking-widest text-[#d43e76]">
                    {featured.tags[0]}
                  </p>
                )}
                <h2 className="text-2xl font-black leading-tight tracking-tight text-neutral-900 md:text-4xl">
                  {featured.title}
                </h2>
                {featured.subtitle && (
                  <p className="mt-4 text-sm leading-relaxed text-neutral-600 md:text-base">
                    {featured.subtitle}
                  </p>
                )}
                <span className="mt-6 inline-flex items-center gap-1 text-[12px] font-bold uppercase tracking-wider text-neutral-900 group-hover:text-[#d43e76]">
                  Read more <ArrowRight size={14} />
                </span>
              </div>
            </div>
          </Link>
        )}
      </div>
    </section>
  );
}
