import { createClient } from '@/lib/supabase/server';
import { redirect, notFound } from 'next/navigation';
import { DashboardHeader } from '@/components/layout/DashboardHeader';
import { NewProjectButton } from '@/components/dashboard/NewProjectButton';
import { NewFolderButton } from '@/components/dashboard/NewFolderButton';
import { FolderChip } from '@/components/dashboard/FolderChip';
import { ProjectRow } from '@/components/dashboard/ProjectRow';
import { FolderBreadcrumb } from '@/components/dashboard/FolderBreadcrumb';
import type { Folder } from '@/types/project';
import { SAMPLE_FLOOR_PLAN } from '@/lib/sample-project';
import { OnboardingGuide } from '@/components/dashboard/OnboardingGuide';

interface FolderRow {
  id: string;
  name: string;
  color: string | null;
}

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ folder?: string }>;
}) {
  const { folder: folderIdRaw } = await searchParams;
  const folderId = folderIdRaw || null;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/');

  let currentFolder: { id: string; name: string } | null = null;
  if (folderId) {
    const { data } = await supabase
      .from('iso_folders')
      .select('id, name')
      .eq('id', folderId)
      .single();
    if (!data) notFound();
    currentFolder = data;
  }

  const { data: allFolders } = await supabase
    .from('iso_folders')
    .select('id, name, color')
    .order('name');
  const folders: FolderRow[] = allFolders ?? [];
  const folderList: Folder[] = folders.map((f) => ({
    id: f.id,
    name: f.name,
    color: f.color,
  }));

  let projectsQuery = supabase
    .from('iso_projects')
    .select('id, name, thumbnail_url, updated_at, folder_id')
    .order('updated_at', { ascending: false });

  if (folderId) {
    projectsQuery = projectsQuery.eq('folder_id', folderId);
  } else {
    projectsQuery = projectsQuery.is('folder_id', null);
  }

  let { data: projects } = await projectsQuery;

  // 첫 방문 — 프로젝트 0개이면 샘플 자동 생성
  if (!folderId && (!projects || projects.length === 0)) {
    const { count: totalCount } = await supabase
      .from('iso_projects')
      .select('id', { count: 'exact', head: true });
    if ((totalCount ?? 0) === 0) {
      await supabase.from('iso_projects').insert({
        user_id: user.id,
        name: '샘플 아파트 (체험용)',
        rooms_data: SAMPLE_FLOOR_PLAN,
      });
      const { data: refreshed } = await supabase
        .from('iso_projects')
        .select('id, name, thumbnail_url, updated_at, folder_id')
        .is('folder_id', null)
        .order('updated_at', { ascending: false });
      projects = refreshed;
    }
  }

  let folderCounts: Record<string, number> = {};
  if (!folderId && folders.length > 0) {
    const { data: allProj } = await supabase
      .from('iso_projects')
      .select('folder_id')
      .not('folder_id', 'is', null);
    for (const p of allProj ?? []) {
      const fid = (p as { folder_id: string | null }).folder_id;
      if (fid) folderCounts[fid] = (folderCounts[fid] ?? 0) + 1;
    }
  }

  // 사용량 조회 (누적 횟수 충전 방식)
  const { data: myProfile } = await supabase
    .from('iso_profiles')
    .select('purchased_renders')
    .eq('id', user.id)
    .single();
  const renderLimit = myProfile?.purchased_renders ?? 0;
  const { count: renderCount } = await supabase
    .from('iso_renders')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', user.id);
  const projectCount = (projects?.length ?? 0);

  return (
    <>
      <DashboardHeader email={user.email ?? ''} />
      <main className="flex-1 bg-neutral-50">
        <div className="mx-auto max-w-[1280px] px-6 py-10">
          {/* 사용량 */}
          <div className="mb-6 flex gap-4 flex-wrap">
            <div className="rounded-xl border border-neutral-200 bg-white px-4 py-3 min-w-[140px]">
              <p className="text-[10px] font-bold uppercase tracking-wider text-neutral-400">렌더링 잔여</p>
              <p className="mt-1 text-xl font-black">{Math.max(0, renderLimit - (renderCount ?? 0))}<span className="text-sm font-medium text-neutral-400">/{renderLimit}</span></p>
              <div className="mt-1.5 h-1.5 rounded-full bg-neutral-100 overflow-hidden">
                <div className={`h-full rounded-full ${(renderCount ?? 0) >= renderLimit ? 'bg-red-500' : 'bg-emerald-500'}`} style={{ width: `${Math.min(100, ((renderCount ?? 0) / Math.max(1, renderLimit)) * 100)}%` }} />
              </div>
            </div>
            <div className="rounded-xl border border-neutral-200 bg-white px-4 py-3 min-w-[140px]">
              <p className="text-[10px] font-bold uppercase tracking-wider text-neutral-400">Projects</p>
              <p className="mt-1 text-xl font-black">{projectCount}</p>
            </div>
            <a
              href="/quick-render"
              className="flex items-center gap-2 rounded-xl border border-dashed border-neutral-300 bg-white px-4 py-3 text-xs font-medium text-neutral-600 hover:border-neutral-400 hover:bg-neutral-50"
            >
              Quick Render →
            </a>
          </div>

          {/* 온보딩 가이드 — 프로젝트 1개 이하일 때 표시 */}
          {(projects?.length ?? 0) <= 1 && !folderId && <OnboardingGuide />}

          {/* Header */}
          <div className="mb-8 flex items-end justify-between border-b border-neutral-900 pb-4">
            <div>
              {currentFolder ? (
                <FolderBreadcrumb name={currentFolder.name} />
              ) : (
                <>
                  <p className="mb-1 text-[11px] font-bold uppercase tracking-[0.25em] text-[#d43e76]">
                    Workspace
                  </p>
                  <h1 className="text-3xl font-black tracking-tight text-neutral-900">
                    My Projects
                  </h1>
                </>
              )}
            </div>
            <div className="flex items-center gap-2">
              {!currentFolder && <NewFolderButton />}
              <NewProjectButton folderId={folderId} />
            </div>
          </div>

          {/* Folders */}
          {!currentFolder && folders.length > 0 && (
            <section className="mb-10">
              <h2 className="mb-4 text-[11px] font-bold uppercase tracking-[0.2em] text-neutral-400">
                Folders
              </h2>
              <div className="flex gap-4 overflow-x-auto pb-2">
                {folders.map((f) => (
                  <FolderChip
                    key={f.id}
                    id={f.id}
                    name={f.name}
                    count={folderCounts[f.id] ?? 0}
                  />
                ))}
              </div>
            </section>
          )}

          {/* Projects */}
          <section>
            {!currentFolder && (
              <h2 className="mb-4 text-[11px] font-bold uppercase tracking-[0.2em] text-neutral-400">
                Projects
              </h2>
            )}

            {!projects || projects.length === 0 ? (
              <div className="border border-dashed border-neutral-300 bg-white px-6 py-16 text-center">
                <p className="text-sm font-semibold text-neutral-700">
                  {currentFolder
                    ? '이 폴더에 프로젝트가 없습니다'
                    : '미분류 프로젝트가 없습니다'}
                </p>
                <p className="mt-1 text-xs text-neutral-500">
                  &quot;새 프로젝트&quot; 버튼으로 시작하세요
                </p>
              </div>
            ) : (
              <div className="grid gap-6 grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
                {projects.map((p) => (
                  <ProjectRow
                    key={p.id}
                    id={p.id}
                    name={p.name}
                    thumbnailUrl={p.thumbnail_url}
                    updatedAt={p.updated_at}
                    folderId={p.folder_id}
                    folders={folderList}
                  />
                ))}
              </div>
            )}
          </section>
        </div>
      </main>
    </>
  );
}
