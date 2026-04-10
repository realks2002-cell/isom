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

  // 현재 폴더 정보 (폴더 내부일 때만)
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

  // 모든 폴더 (이동 드롭다운용 + 루트 표시용)
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

  // 프로젝트: 루트면 folder_id is null, 폴더 내부면 해당 folder_id
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

  // 폴더별 프로젝트 카운트 (루트 뷰에서만 필요)
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
      <main className="flex-1 mx-auto w-full max-w-3xl px-4 py-6">
        <div className="flex items-center justify-between mb-5 gap-3">
          {currentFolder ? (
            <FolderBreadcrumb name={currentFolder.name} />
          ) : (
            <h1 className="text-xl font-bold">내 프로젝트</h1>
          )}
          <div className="flex items-center gap-2">
            {!currentFolder && <NewFolderButton />}
            <NewProjectButton folderId={folderId} />
          </div>
        </div>

        {/* 폴더 섹션 (루트에서만) */}
        {!currentFolder && folders.length > 0 && (
          <section className="mb-6">
            <h2 className="text-xs font-medium text-neutral-500 mb-2">폴더</h2>
            <div className="flex gap-3 overflow-x-auto pb-2 -mx-4 px-4">
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

        {/* 프로젝트 섹션 */}
        <section>
          {!currentFolder && (
            <h2 className="text-xs font-medium text-neutral-500 mb-2">
              프로젝트
            </h2>
          )}

          {!projects || projects.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-neutral-300 bg-white py-12 text-center">
              <p className="text-sm text-neutral-600">
                {currentFolder
                  ? '이 폴더에 프로젝트가 없습니다.'
                  : '미분류 프로젝트가 없습니다.'}
              </p>
              <p className="text-xs text-neutral-500 mt-1">
                오른쪽 위 &quot;새 프로젝트&quot;로 시작하세요.
              </p>
            </div>
          ) : (
            <div className="rounded-2xl border border-neutral-200 bg-white overflow-hidden">
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
      </main>
    </>
  );
}
