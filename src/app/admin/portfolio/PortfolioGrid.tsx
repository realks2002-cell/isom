'use client';

import { useState, useRef, useTransition } from 'react';
import Link from 'next/link';
import { Pencil, GripVertical } from 'lucide-react';
import type { PortfolioItem } from '@/types/portfolio';
import { DeleteButton } from './DeleteButton';
import { reorderPortfolio } from './actions';

interface Props {
  items: PortfolioItem[];
}

export function PortfolioGrid({ items: initial }: Props) {
  const [items, setItems] = useState(initial);
  const [dragging, setDragging] = useState<string | null>(null);
  const [over, setOver] = useState<string | null>(null);
  const [saving, startSaving] = useTransition();
  const dragIdx = useRef(-1);

  const handleDragStart = (e: React.DragEvent, id: string, idx: number) => {
    setDragging(id);
    dragIdx.current = idx;
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent, id: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setOver(id);
  };

  const handleDrop = (e: React.DragEvent, targetIdx: number) => {
    e.preventDefault();
    const fromIdx = dragIdx.current;
    if (fromIdx === targetIdx || fromIdx < 0) return;

    const next = [...items];
    const [moved] = next.splice(fromIdx, 1);
    next.splice(targetIdx, 0, moved);
    setItems(next);
    setDragging(null);
    setOver(null);

    // 서버에 순서 저장
    const order = next.map((item, i) => ({ id: item.id, sort_order: next.length - i }));
    startSaving(async () => {
      await reorderPortfolio(order);
    });
  };

  return (
    <>
      {saving && (
        <div className="mb-3 rounded-lg bg-blue-50 border border-blue-200 px-3 py-1.5 text-xs text-blue-700">
          순서 저장 중...
        </div>
      )}
      <div className="grid gap-4 md:grid-cols-3">
        {items.length === 0 && (
          <div className="col-span-full rounded-2xl border border-dashed border-neutral-300 bg-white p-10 text-center text-sm text-neutral-500">
            등록된 포트폴리오가 없습니다.
          </div>
        )}
        {items.map((item, idx) => (
          <div
            key={item.id}
            draggable
            onDragStart={(e) => handleDragStart(e, item.id, idx)}
            onDragOver={(e) => handleDragOver(e, item.id)}
            onDragLeave={() => setOver(null)}
            onDrop={(e) => handleDrop(e, idx)}
            onDragEnd={() => { setDragging(null); setOver(null); }}
            className={`overflow-hidden rounded-2xl border bg-white shadow-sm transition cursor-grab active:cursor-grabbing ${
              dragging === item.id
                ? 'opacity-40 border-neutral-400'
                : over === item.id
                ? 'border-blue-400 ring-2 ring-blue-200'
                : 'border-neutral-200'
            }`}
          >
            <div className="relative aspect-[4/3] bg-neutral-100">
              {item.thumbnail_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={item.thumbnail_url}
                  alt={item.title}
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="flex h-full items-center justify-center text-neutral-300">
                  no image
                </div>
              )}
              <span
                className={`absolute left-3 top-3 rounded-full px-2 py-0.5 text-[10px] font-bold ${
                  item.is_active && item.status === 'active'
                    ? 'bg-emerald-500 text-white'
                    : 'bg-neutral-500 text-white'
                }`}
              >
                {item.is_active ? item.status.toUpperCase() : 'HIDDEN'}
              </span>
              <div className="absolute right-2 top-2 rounded-lg bg-white/80 p-1">
                <GripVertical size={16} className="text-neutral-400" />
              </div>
            </div>
            <div className="p-4">
              <h3 className="truncate text-sm font-bold">{item.title}</h3>
              {item.subtitle && (
                <p className="mt-0.5 truncate text-xs text-neutral-500">
                  {item.subtitle}
                </p>
              )}
              <div className="mt-3 flex items-center gap-2">
                <Link
                  href={`/admin/portfolio/${item.id}`}
                  className="inline-flex items-center gap-1 rounded-lg border border-neutral-300 px-2.5 py-1 text-xs hover:bg-neutral-50"
                >
                  <Pencil size={12} /> 수정
                </Link>
                <DeleteButton id={item.id} />
                <span className="ml-auto text-[11px] text-neutral-400">
                  #{idx + 1}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </>
  );
}
