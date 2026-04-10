'use client';

import { useTransition } from 'react';
import { Trash2 } from 'lucide-react';
import { deletePortfolio } from './actions';

export function DeleteButton({ id }: { id: string }) {
  const [pending, start] = useTransition();
  return (
    <button
      type="button"
      disabled={pending}
      onClick={() => {
        if (!confirm('정말 삭제하시겠습니까?')) return;
        const fd = new FormData();
        fd.set('id', id);
        start(async () => {
          await deletePortfolio(fd);
        });
      }}
      className="inline-flex items-center gap-1 rounded-lg border border-red-200 px-2.5 py-1 text-xs text-red-600 hover:bg-red-50 disabled:opacity-50"
    >
      <Trash2 size={12} /> 삭제
    </button>
  );
}
