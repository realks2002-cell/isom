'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Plus } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

export function NewProjectButton({ folderId }: { folderId?: string | null }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [isPending, startTransition] = useTransition();

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    startTransition(async () => {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('iso_projects')
        .insert({
          user_id: user.id,
          name: name.trim(),
          folder_id: folderId ?? null,
        })
        .select('id')
        .single();

      if (error || !data) {
        alert('프로젝트 생성 실패: ' + (error?.message ?? '알 수 없는 오류'));
        return;
      }

      setOpen(false);
      setName('');
      router.push(`/editor/${data.id}`);
    });
  };

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-1.5 bg-neutral-900 px-4 py-2 text-[12px] font-bold uppercase tracking-wider text-white hover:bg-[#d43e76]"
      >
        <Plus size={14} /> New Project
      </button>

      {open && (
        <div
          className="fixed inset-0 z-20 flex items-center justify-center bg-black/50 p-4"
          onClick={() => setOpen(false)}
        >
          <form
            onClick={(e) => e.stopPropagation()}
            onSubmit={handleCreate}
            className="w-full max-w-sm border border-neutral-200 bg-white p-6 shadow-xl"
          >
            <h2 className="mb-1 text-lg font-black tracking-tight">New Project</h2>
            <p className="mb-5 text-[12px] text-neutral-500">프로젝트 이름을 입력하세요</p>
            <input
              autoFocus
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="예: 삼성래미안 301호"
              className="w-full border border-neutral-300 bg-white px-3 py-2.5 text-sm focus:border-neutral-900 focus:outline-none"
            />
            <div className="mt-5 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="px-4 py-2 text-[12px] font-semibold uppercase tracking-wider text-neutral-500 hover:text-neutral-900"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isPending}
                className="bg-neutral-900 px-5 py-2 text-[12px] font-bold uppercase tracking-wider text-white hover:bg-[#d43e76] disabled:opacity-50"
              >
                {isPending ? '...' : 'Create'}
              </button>
            </div>
          </form>
        </div>
      )}
    </>
  );
}
