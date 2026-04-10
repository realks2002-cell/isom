'use client';

import { useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import type { Folder } from '@/types/project';

interface Props {
  projectId: string;
  currentFolderId: string | null;
  folders: Folder[];
}

export function MoveToFolderMenu({ projectId, currentFolderId, folders }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    e.stopPropagation();
    const value = e.target.value;
    const nextFolderId = value === '__root__' ? null : value;
    if (nextFolderId === currentFolderId) return;

    startTransition(async () => {
      const supabase = createClient();
      const { error } = await supabase
        .from('iso_projects')
        .update({ folder_id: nextFolderId })
        .eq('id', projectId);
      if (error) {
        alert('이동 실패: ' + error.message);
        return;
      }
      router.refresh();
    });
  };

  return (
    <select
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
      }}
      onChange={handleChange}
      disabled={isPending}
      defaultValue={currentFolderId ?? '__root__'}
      aria-label="폴더 이동"
      className="text-xs rounded-md border border-neutral-200 bg-white px-2 py-1 text-neutral-600 hover:bg-neutral-50 disabled:opacity-50 max-w-[120px]"
    >
      <option value="__root__">미분류</option>
      {folders.map((f) => (
        <option key={f.id} value={f.id}>
          {f.name}
        </option>
      ))}
    </select>
  );
}
