'use client';

import Link from 'next/link';
import { useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Trash2, Image as ImageIcon } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { MoveToFolderMenu } from './MoveToFolderMenu';
import type { Folder } from '@/types/project';

interface Props {
  id: string;
  name: string;
  thumbnailUrl: string | null;
  updatedAt: string;
  folderId: string | null;
  folders: Folder[];
}

function formatDateTime(iso: string): string {
  const date = new Date(iso);
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  const h = String(date.getHours()).padStart(2, '0');
  const min = String(date.getMinutes()).padStart(2, '0');
  return `${y}.${m}.${d} ${h}:${min}`;
}

export function ProjectRow({
  id,
  name,
  thumbnailUrl,
  updatedAt,
  folderId,
  folders,
}: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const handleDelete = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!confirm('프로젝트를 삭제하시겠어요?')) return;

    startTransition(async () => {
      const supabase = createClient();
      const { error } = await supabase.from('iso_projects').delete().eq('id', id);
      if (error) {
        alert('삭제 실패: ' + error.message);
        return;
      }
      router.refresh();
    });
  };

  return (
    <Link
      href={`/editor/${id}`}
      className="group overflow-hidden border border-neutral-200 bg-white transition hover:shadow-md"
    >
      <div className="relative aspect-[4/3] bg-neutral-100">
        {thumbnailUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={thumbnailUrl}
            alt={name}
            className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.03]"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-neutral-300">
            <ImageIcon size={32} />
          </div>
        )}
      </div>
      <div className="p-4">
        <h3 className="truncate text-[15px] font-black tracking-tight text-neutral-900">
          {name}
        </h3>
        <p className="mt-1 text-[11px] tracking-wider text-neutral-400">
          {formatDateTime(updatedAt)}
        </p>
        <div className="mt-3 flex items-center gap-1.5 opacity-0 transition group-hover:opacity-100">
          <MoveToFolderMenu
            projectId={id}
            currentFolderId={folderId}
            folders={folders}
          />
          <button
            onClick={handleDelete}
            disabled={isPending}
            aria-label="삭제"
            className="rounded-md p-1.5 text-neutral-400 hover:bg-red-50 hover:text-red-600 disabled:opacity-50"
          >
            <Trash2 size={14} />
          </button>
        </div>
      </div>
    </Link>
  );
}
