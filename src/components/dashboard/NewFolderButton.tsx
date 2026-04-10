'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { FolderPlus } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

export function NewFolderButton() {
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

      const { error } = await supabase
        .from('iso_folders')
        .insert({ user_id: user.id, name: name.trim() });

      if (error) {
        alert('폴더 생성 실패: ' + error.message);
        return;
      }

      setOpen(false);
      setName('');
      router.refresh();
    });
  };

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-1.5 rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-50"
      >
        <FolderPlus size={16} />새 폴더
      </button>

      {open && (
        <div
          className="fixed inset-0 z-20 bg-black/40 flex items-center justify-center p-4"
          onClick={() => setOpen(false)}
        >
          <form
            onClick={(e) => e.stopPropagation()}
            onSubmit={handleCreate}
            className="w-full max-w-sm rounded-2xl bg-white p-5 space-y-4"
          >
            <h2 className="font-bold">새 폴더</h2>
            <input
              autoFocus
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="예: 삼성래미안"
              className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-neutral-900"
            />
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="px-3 py-2 text-sm text-neutral-600"
              >
                취소
              </button>
              <button
                type="submit"
                disabled={isPending}
                className="rounded-lg bg-neutral-900 text-white px-4 py-2 text-sm font-medium disabled:opacity-50"
              >
                {isPending ? '생성 중...' : '생성'}
              </button>
            </div>
          </form>
        </div>
      )}
    </>
  );
}
