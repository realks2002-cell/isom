import { createClient } from '@/lib/supabase/server';
import { redirect, notFound } from 'next/navigation';
import { DashboardHeader } from '@/components/layout/DashboardHeader';
import { NewProjectButton } from '@/components/dashboard/NewProjectButton';
import { NewFolderButton } from '@/components/dashboard/NewFolderButton';
import { FolderChip } from '@/components/dashboard/FolderChip';
import { ProjectRow } from '@/components/dashboard/ProjectRow';
import { FolderBreadcrumb } from '@/components/dashboard/FolderBreadcrumb';
import type { Folder } from '@/types/project';

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

  const { data: projects } = await projectsQuery;

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

  return (
    <>
      <DashboardHeader email={user.email ?? ''} />
      <main className="flex-1 bg-neutral-50">
        <div className="mx-auto max-w-[1280px] px-6 py-10">
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
