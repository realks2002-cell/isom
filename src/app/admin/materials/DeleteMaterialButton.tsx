'use client';

import { useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Trash2 } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { invalidateMaterialsCache } from '@/hooks/useMaterials';

export function DeleteMaterialButton({ id }: { id: string }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const handle = () => {
    if (!confirm('이 자재를 삭제하시겠어요?')) return;
    startTransition(async () => {
      const supabase = createClient();
      const { error } = await supabase
        .from('iso_materials')
        .update({ is_active: false })
        .eq('id', id);
      if (error) {
        alert('삭제 실패: ' + error.message);
        return;
      }
      invalidateMaterialsCache();
      router.refresh();
    });
  };
  return (
    <button
      onClick={handle}
      disabled={isPending}
      aria-label="삭제"
      className="p-2 rounded-lg text-neutral-400 hover:text-red-600 hover:bg-red-50"
    >
      <Trash2 size={16} />
    </button>
  );
}
