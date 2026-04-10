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

function formatDate(iso: string): string {
  const date = new Date(iso);
  const now = Date.now();
  const diff = now - date.getTime();
  const day = 24 * 60 * 60 * 1000;
  if (diff < day) return '오늘';
  if (diff < 2 * day) return '어제';
  if (diff < 7 * day) return `${Math.floor(diff / day)}일 전`;
  return date.toLocaleDateString('ko-KR');
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
      className="group flex items-center gap-3 px-3 py-2.5 hover:bg-neutral-50 border-b border-neutral-100 last:border-b-0"
    >
      <div className="flex-shrink-0 w-[72px] h-12 rounded-lg bg-neutral-100 overflow-hidden flex items-center justify-center">
        {thumbnailUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={thumbnailUrl}
            alt={name}
            className="w-full h-full object-cover"
          />
        ) : (
          <ImageIcon size={18} className="text-neutral-300" />
        )}
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-medium text-sm text-neutral-900 truncate">{name}</p>
        <p className="text-xs text-neutral-500 mt-0.5">{formatDate(updatedAt)}</p>
      </div>
      <div className="flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition">
        <MoveToFolderMenu
          projectId={id}
          currentFolderId={folderId}
          folders={folders}
        />
        <button
          onClick={handleDelete}
          disabled={isPending}
          aria-label="삭제"
          className="rounded-md p-1.5 text-neutral-500 hover:bg-red-50 hover:text-red-600 disabled:opacity-50"
        >
          <Trash2 size={14} />
        </button>
      </div>
    </Link>
  );
}
