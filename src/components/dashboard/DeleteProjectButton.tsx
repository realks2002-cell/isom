'use client';

import { useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Trash2 } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

export function DeleteProjectButton({ projectId }: { projectId: string }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const handleDelete = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!confirm('프로젝트를 삭제하시겠어요?')) return;

    startTransition(async () => {
      const supabase = createClient();
      const { error } = await supabase.from('iso_projects').delete().eq('id', projectId);
      if (error) {
        alert('삭제 실패: ' + error.message);
        return;
      }
      router.refresh();
    });
  };

  return (
    <button
      onClick={handleDelete}
      disabled={isPending}
      aria-label="삭제"
      className="absolute top-2 right-2 rounded-full bg-white/90 border border-neutral-200 p-1.5 opacity-0 group-hover:opacity-100 hover:bg-red-50 hover:text-red-600 transition"
    >
      <Trash2 size={14} />
    </button>
  );
}
