'use client';

import { useState, useEffect, useMemo } from 'react';
import { X } from 'lucide-react';
import { useMaterials } from '@/hooks/useMaterials';
import type { Material } from '@/types/material';
import type { PartType, Room } from '@/types/room';
import { PartSelector } from './PartSelector';
import { CategoryTabs } from './CategoryTabs';
import { MaterialCard } from './MaterialCard';

interface Props {
  room: Room;
  initialPart: PartType;
  onApply: (part: PartType, material: Material) => void;
  onClose: () => void;
}

export function MaterialPanel({ room, initialPart, onApply, onClose }: Props) {
  const [part, setPart] = useState<PartType>(initialPart);
  const { filteredCategories, getMaterialsByCategory, loading } = useMaterials(part);
  const [categoryId, setCategoryId] = useState<string | null>(null);

  useEffect(() => {
    setCategoryId(filteredCategories[0]?.id ?? null);
  }, [part, filteredCategories.length]); // eslint-disable-line react-hooks/exhaustive-deps

  const currentAssignment = room[part];
  const materials = useMemo(
    () => (categoryId ? getMaterialsByCategory(categoryId) : []),
    [categoryId, getMaterialsByCategory]
  );

  return (
    <>
      {/* 모바일 백드롭 */}
      <div
        className="md:hidden fixed inset-0 bg-black/20 z-30"
        onClick={onClose}
      />
      <aside
        className="
          fixed z-40 bg-white border-neutral-200 shadow-xl flex flex-col
          bottom-0 left-0 right-0 h-[55vh] rounded-t-2xl border-t
          md:top-14 md:bottom-0 md:right-0 md:left-auto md:w-[300px] md:h-auto md:rounded-none md:border-l md:border-t-0
        "
      >
        <div className="flex items-center justify-between px-4 py-3 border-b border-neutral-100">
          <div>
            <h2 className="text-sm font-bold">{room.name}</h2>
            <p className="text-[11px] text-neutral-500">마감재 선택</p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-neutral-100"
            aria-label="닫기"
          >
            <X size={18} />
          </button>
        </div>

        <div className="px-4 py-3 space-y-3 border-b border-neutral-100">
          <PartSelector value={part} onChange={setPart} />
          <CategoryTabs
            categories={filteredCategories}
            value={categoryId}
            onChange={setCategoryId}
          />
        </div>

        <div className="flex-1 overflow-y-auto p-3">
          {loading ? (
            <p className="text-xs text-neutral-500 text-center py-8">불러오는 중...</p>
          ) : materials.length === 0 ? (
            <p className="text-xs text-neutral-500 text-center py-8">
              등록된 자재가 없습니다
            </p>
          ) : (
            <div className="grid grid-cols-3 gap-2">
              {materials.map((m) => (
                <MaterialCard
                  key={m.id}
                  material={m}
                  selected={currentAssignment.materialId === m.id}
                  onClick={() => onApply(part, m)}
                />
              ))}
            </div>
          )}
        </div>
      </aside>
    </>
  );
}
