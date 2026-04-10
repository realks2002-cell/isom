'use client';

import { useTransition, useState } from 'react';
import { createPortfolio, updatePortfolio } from './actions';
import type { PortfolioItem } from '@/types/portfolio';

interface Props {
  item?: PortfolioItem;
}

export function PortfolioForm({ item }: Props) {
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();

  const onSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    const fd = new FormData(e.currentTarget);
    if (item) fd.set('id', item.id);
    start(async () => {
      const result = item ? await updatePortfolio(fd) : await createPortfolio(fd);
      if (result && 'error' in result) setError(result.error);
    });
  };

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <Field label="제목">
        <input
          name="title"
          defaultValue={item?.title}
          required
          className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm"
        />
      </Field>
      <Field label="부제">
        <input
          name="subtitle"
          defaultValue={item?.subtitle ?? ''}
          className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm"
        />
      </Field>
      <div className="grid grid-cols-2 gap-4">
        <Field label="상태">
          <select
            name="status"
            defaultValue={item?.status ?? 'active'}
            className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm"
          >
            <option value="active">ACTIVE</option>
            <option value="draft">DRAFT</option>
          </select>
        </Field>
        <Field label="레이어 수">
          <input
            type="number"
            name="layer_count"
            defaultValue={item?.layer_count ?? 0}
            className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm"
          />
        </Field>
      </div>
      <Field label="태그 (쉼표 구분)">
        <input
          name="tags"
          defaultValue={(item?.tags ?? []).join(', ')}
          placeholder="모던, 거실, 리모델링"
          className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm"
        />
      </Field>
      <div className="grid grid-cols-2 gap-4">
        <Field label="정렬 순서 (높을수록 위)">
          <input
            type="number"
            name="sort_order"
            defaultValue={item?.sort_order ?? 0}
            className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm"
          />
        </Field>
        <Field label="공개">
          <label className="flex h-10 items-center gap-2 text-sm">
            <input
              type="checkbox"
              name="is_active"
              defaultChecked={item?.is_active ?? true}
              className="h-4 w-4"
            />
            랜딩에 노출
          </label>
        </Field>
      </div>
      <Field label="썸네일 이미지">
        {item?.thumbnail_url && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={item.thumbnail_url}
            alt=""
            className="mb-2 h-24 w-32 rounded-lg border border-neutral-200 object-cover"
          />
        )}
        <input
          type="file"
          name="thumbnail"
          accept="image/*"
          className="block w-full text-xs"
        />
        <p className="mt-1 text-[11px] text-neutral-500">
          {item ? '비우면 기존 이미지 유지' : '권장 4:3 비율'}
        </p>
      </Field>

      {error && (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-xs text-red-600">{error}</p>
      )}

      <div className="flex items-center gap-2 pt-2">
        <button
          type="submit"
          disabled={pending}
          className="rounded-lg bg-neutral-900 px-5 py-2.5 text-sm font-medium text-white hover:bg-neutral-800 disabled:opacity-50"
        >
          {pending ? '저장 중...' : item ? '수정' : '등록'}
        </button>
        <a
          href="/admin/portfolio"
          className="rounded-lg border border-neutral-300 px-5 py-2.5 text-sm hover:bg-neutral-50"
        >
          취소
        </a>
      </div>
    </form>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-medium text-neutral-700">{label}</span>
      {children}
    </label>
  );
}
