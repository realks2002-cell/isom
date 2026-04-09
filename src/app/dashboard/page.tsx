import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { DashboardHeader } from '@/components/layout/DashboardHeader';
import { NewProjectButton } from '@/components/dashboard/NewProjectButton';
import { DeleteProjectButton } from '@/components/dashboard/DeleteProjectButton';

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect('/');

  const { data: projects } = await supabase
    .from('iso_projects')
    .select('id, name, thumbnail_url, updated_at')
    .order('updated_at', { ascending: false });

  return (
    <>
      <DashboardHeader email={user.email ?? ''} />
      <main className="flex-1 mx-auto w-full max-w-5xl px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-xl font-bold">내 프로젝트</h1>
          <NewProjectButton />
        </div>

        {!projects || projects.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-neutral-300 bg-white py-16 text-center">
            <p className="text-sm text-neutral-600">아직 프로젝트가 없습니다.</p>
            <p className="text-xs text-neutral-500 mt-1">
              오른쪽 위 &quot;새 프로젝트&quot;로 시작하세요.
            </p>
          </div>
        ) : (
          <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {projects.map((p) => (
              <li
                key={p.id}
                className="group relative rounded-2xl border border-neutral-200 bg-white overflow-hidden hover:shadow-md transition"
              >
                <Link href={`/editor/${p.id}`} className="block">
                  <div className="aspect-video bg-neutral-100">
                    {p.thumbnail_url && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={p.thumbnail_url}
                        alt={p.name}
                        className="w-full h-full object-cover"
                      />
                    )}
                  </div>
                  <div className="p-3">
                    <p className="font-medium text-sm truncate">{p.name}</p>
                    <p className="text-xs text-neutral-500 mt-0.5">
                      {new Date(p.updated_at).toLocaleDateString('ko-KR')}
                    </p>
                  </div>
                </Link>
                <DeleteProjectButton projectId={p.id} />
              </li>
            ))}
          </ul>
        )}
      </main>
    </>
  );
}
