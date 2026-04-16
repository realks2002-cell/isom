import { notFound } from 'next/navigation';
import Link from 'next/link';
import { Download } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';

export default async function SharePage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const supabase = await createClient();

  const { data: render } = await supabase
    .from('iso_renders')
    .select('id, public_url, style, quality, created_at')
    .eq('share_token', token)
    .single();

  if (!render || !render.public_url) notFound();

  return (
    <div className="min-h-screen bg-neutral-900 flex flex-col">
      <header className="flex items-center justify-between px-4 py-3 bg-neutral-900 border-b border-neutral-800">
        <Link href="/" className="text-sm font-bold text-white">
          ISOPLAN 3D
        </Link>
        <div className="flex items-center gap-3">
          <span className="text-[11px] text-neutral-400">
            {render.style} · {render.quality}
          </span>
          <a
            href={render.public_url}
            download="isoplan-render.png"
            className="inline-flex items-center gap-1.5 rounded-lg bg-white px-3 py-1.5 text-xs font-medium text-neutral-900 hover:bg-neutral-100"
          >
            <Download size={14} /> PNG 저장
          </a>
        </div>
      </header>

      <main className="flex-1 flex items-center justify-center p-4">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={render.public_url}
          alt="AI 렌더링 결과"
          className="max-w-full max-h-[85vh] rounded-lg shadow-2xl"
        />
      </main>

      <footer className="text-center py-4 text-[11px] text-neutral-500">
        Rendered by{' '}
        <Link href="/" className="text-white hover:underline">
          ISOPLAN 3D
        </Link>
      </footer>
    </div>
  );
}
