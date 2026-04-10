'use client';

import Link from 'next/link';
import { useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Folder, X } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

interface Props {
  id: string;
  name: string;
  count: number;
}

export function FolderChip({ id, name, count }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const handleDelete = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const msg =
      count > 0
        ? `폴더를 삭제할까요?\n내부 프로젝트 ${count}개는 미분류로 이동합니다.`
        : '폴더를 삭제할까요?';
    if (!confirm(msg)) return;

    startTransition(async () => {
      const supabase = createClient();
      const { error } = await supabase.from('iso_folders').delete().eq('id', id);
      if (error) {
        alert('폴더 삭제 실패: ' + error.message);
        return;
      }
      router.refresh();
    });
  };

  return (
    <Link
      href={`/dashboard?folder=${id}`}
      className="group relative flex-shrink-0 flex flex-col items-center justify-center gap-1 w-24 h-24 rounded-2xl border border-neutral-200 bg-neutral-50 hover:bg-white hover:shadow-md transition"
    >
      <Folder size={26} className="text-neutral-500" />
      <span className="text-xs font-medium text-neutral-800 truncate max-w-[80%]">
        {name}
      </span>
      <span className="text-[10px] text-neutral-500">{count}개</span>
      <button
        onClick={handleDelete}
        disabled={isPending}
        aria-label="폴더 삭제"
        className="absolute -top-1.5 -right-1.5 rounded-full bg-white border border-neutral-200 p-1 opacity-0 group-hover:opacity-100 hover:bg-red-50 hover:text-red-600 transition"
      >
        <X size={12} />
      </button>
    </Link>
  );
}
