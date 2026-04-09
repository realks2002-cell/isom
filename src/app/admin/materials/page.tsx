import { createClient } from '@/lib/supabase/server';
import { notFound, redirect } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { MaterialForm } from './MaterialForm';
import { DeleteMaterialButton } from './DeleteMaterialButton';

export default async function AdminMaterialsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/');

  const { data: profile } = await supabase
    .from('iso_profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (profile?.role !== 'admin') notFound();

  const [{ data: categories }, { data: materials }] = await Promise.all([
    supabase.from('iso_material_categories').select('*').order('sort_order'),
    supabase
      .from('iso_materials')
      .select('*, iso_material_categories(name, parent_type)')
      .order('created_at', { ascending: false }),
  ]);

  return (
    <div className="flex-1 flex flex-col">
      <header className="border-b border-neutral-200 bg-white h-14 px-4 flex items-center gap-3">
        <Link href="/dashboard" className="p-2 -ml-2 hover:bg-neutral-100 rounded-lg">
          <ArrowLeft size={18} />
        </Link>
        <h1 className="font-medium text-sm">자재 관리</h1>
      </header>
      <main className="flex-1 mx-auto w-full max-w-5xl px-4 py-6 space-y-6">
        <section className="rounded-2xl border border-neutral-200 bg-white p-5">
          <h2 className="font-medium text-sm mb-3">새 자재 등록</h2>
          <MaterialForm categories={categories ?? []} />
        </section>

        <section className="rounded-2xl border border-neutral-200 bg-white overflow-hidden">
          <div className="px-5 py-3 border-b border-neutral-100">
            <h2 className="font-medium text-sm">
              등록된 자재 ({materials?.length ?? 0})
            </h2>
          </div>
          <ul className="divide-y divide-neutral-100">
            {(materials ?? []).map((m) => (
              <li key={m.id} className="flex items-center gap-3 px-5 py-3">
                <div
                  className="w-10 h-10 rounded-lg border border-neutral-200 flex-shrink-0"
                  style={{ backgroundColor: m.color_hex }}
                />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{m.name}</p>
                  <p className="text-xs text-neutral-500 truncate">
                    {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                    {(m.iso_material_categories as any)?.name} · {m.pattern_type}
                    {m.brand ? ` · ${m.brand}` : ''}
                  </p>
                </div>
                <DeleteMaterialButton id={m.id} />
              </li>
            ))}
          </ul>
        </section>
      </main>
    </div>
  );
}
