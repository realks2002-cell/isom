'use client';

import { useState, useEffect, useMemo, useRef } from 'react';
import { X, ChevronDown, Layers } from 'lucide-react';
import { useMaterials } from '@/hooks/useMaterials';
import type { Material } from '@/types/material';
import type { PartType, Room } from '@/types/room';
import { PartSelector } from './PartSelector';
import { CategoryTabs } from './CategoryTabs';
import { MaterialCard } from './MaterialCard';
import { ROOM_PRESETS, type BuildingType } from '@/lib/building-types';

interface Props {
  room: Room;
  rooms: Room[];
  initialPart: PartType;
  wallIndex?: number;
  buildingType: BuildingType;
  onApply: (part: PartType, material: Material) => void;
  onApplyAll: (part: PartType, material: Material) => void;
  onRename: (name: string) => void;
  onSelectRoom: (roomId: string) => void;
  onPartChange: (part: PartType) => void;
  onClose: () => void;
}

export function MaterialPanel({
  room, rooms, initialPart, wallIndex, buildingType,
  onApply, onApplyAll, onRename, onSelectRoom, onPartChange, onClose,
}: Props) {
  const [part, setPart] = useState<PartType>(initialPart);
  const { filteredCategories, getMaterialsByCategory, loading } = useMaterials(part);
  const [categoryId, setCategoryId] = useState<string | null>(null);
  const [nameOpen, setNameOpen] = useState(false);
  const [customInput, setCustomInput] = useState(false);
  const [roomListOpen, setRoomListOpen] = useState(false);
  const [lastApplied, setLastApplied] = useState<Material | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setCategoryId(filteredCategories[0]?.id ?? null);
  }, [part, filteredCategories.length]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (customInput && inputRef.current) inputRef.current.focus();
  }, [customInput]);

  const currentAssignment =
    part === 'wall' && wallIndex !== undefined
      ? (room.walls?.[wallIndex] ?? room.wall)
      : room[part];
  const materials = useMemo(
    () => (categoryId ? getMaterialsByCategory(categoryId) : []),
    [categoryId, getMaterialsByCategory]
  );

  const handlePresetClick = (name: string) => {
    onRename(name);
    setNameOpen(false);
    setCustomInput(false);
  };

  const handleCustomSubmit = (value: string) => {
    const trimmed = value.trim();
    if (trimmed) onRename(trimmed);
    setNameOpen(false);
    setCustomInput(false);
  };

  return (
    <>
      <div className="md:hidden fixed inset-0 bg-black/20 z-30 pointer-events-none" />
      <aside
        className="
          fixed z-40 bg-white border-neutral-200 shadow-xl flex flex-col
          bottom-0 left-0 right-0 h-[55vh] rounded-t-2xl border-t
          md:top-14 md:bottom-0 md:right-0 md:left-auto md:w-[300px] md:h-auto md:rounded-none md:border-l md:border-t-0
        "
      >
        {/* 헤더: 방 이름 + 방 선택 */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-neutral-100">
          <div className="relative flex-1 min-w-0">
            <div className="flex items-center gap-2">
              {/* 방 이름 (클릭 → 이름 변경) */}
              <button
                onClick={() => { setNameOpen(!nameOpen); setCustomInput(false); setRoomListOpen(false); }}
                className="flex items-center gap-1 hover:bg-neutral-50 rounded-lg px-2 py-1 -mx-2 -my-1 min-w-0"
              >
                <h2 className="text-sm font-bold truncate">{room.name}</h2>
                <ChevronDown size={14} className="text-neutral-400 shrink-0" />
              </button>

              {/* 방 전환 버튼 */}
              <button
                onClick={() => { setRoomListOpen(!roomListOpen); setNameOpen(false); }}
                className="shrink-0 p-1 rounded-lg hover:bg-neutral-100"
                title="방 선택"
              >
                <Layers size={15} className="text-neutral-400" />
              </button>
            </div>
            <p className="text-[11px] text-neutral-500">마감재 선택</p>

            {/* 방 이름 변경 드롭다운 */}
            {nameOpen && (
              <div className="absolute top-8 left-0 z-50 bg-white border border-neutral-200 rounded-lg shadow-lg py-1 w-36 max-h-60 overflow-y-auto">
                {ROOM_PRESETS[buildingType].map((preset) => (
                  <button
                    key={preset.name}
                    onClick={() => handlePresetClick(preset.name)}
                    className={`w-full text-left px-3 py-1.5 text-xs hover:bg-neutral-50 ${
                      room.name === preset.name ? 'text-blue-600 font-semibold' : 'text-neutral-700'
                    }`}
                  >
                    {preset.name}
                  </button>
                ))}
                <div className="border-t border-neutral-100 mt-1 pt-1">
                  {customInput ? (
                    <input
                      ref={inputRef}
                      type="text"
                      defaultValue={room.name}
                      className="w-full px-3 py-1.5 text-xs outline-none"
                      placeholder="방 이름 입력"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleCustomSubmit(e.currentTarget.value);
                        if (e.key === 'Escape') { setNameOpen(false); setCustomInput(false); }
                      }}
                      onBlur={(e) => handleCustomSubmit(e.currentTarget.value)}
                    />
                  ) : (
                    <button
                      onClick={() => setCustomInput(true)}
                      className="w-full text-left px-3 py-1.5 text-xs text-neutral-500 hover:bg-neutral-50"
                    >
                      직접 입력...
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* 방 목록 드롭다운 */}
            {roomListOpen && (
              <div className="absolute top-8 left-0 z-50 bg-white border border-neutral-200 rounded-lg shadow-lg py-1 w-44 max-h-60 overflow-y-auto">
                {rooms.map((r) => (
                  <button
                    key={r.id}
                    onClick={() => { onSelectRoom(r.id); setRoomListOpen(false); }}
                    className={`w-full text-left px-3 py-1.5 text-xs hover:bg-neutral-50 ${
                      r.id === room.id ? 'text-blue-600 font-semibold bg-blue-50' : 'text-neutral-700'
                    }`}
                  >
                    {r.name}
                  </button>
                ))}
              </div>
            )}
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-neutral-100 shrink-0"
            aria-label="닫기"
          >
            <X size={18} />
          </button>
        </div>

        {/* 파트 선택 + 카테고리 */}
        <div className="px-4 py-3 space-y-3 border-b border-neutral-100">
          <PartSelector value={part} onChange={(p) => { setPart(p); onPartChange(p); }} />
          <CategoryTabs
            categories={filteredCategories}
            value={categoryId}
            onChange={setCategoryId}
          />
        </div>

        {/* 자재 목록 */}
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
                  onClick={() => { onApply(part, m); setLastApplied(m); }}
                />
              ))}
            </div>
          )}
        </div>

        {/* 전체 적용 버튼 — 항상 표시 */}
        <div className="px-4 py-2 border-t border-neutral-100 shrink-0">
          <button
            onClick={() => {
              const mat = lastApplied ?? materials.find((m) => currentAssignment.materialId === m.id);
              if (mat) onApplyAll(part, mat);
            }}
            disabled={!lastApplied && !currentAssignment.materialId}
            className="w-full rounded-lg bg-red-50 border border-red-200 py-2 text-xs font-bold text-red-700 hover:bg-red-100 disabled:opacity-30 disabled:cursor-not-allowed"
          >
            {lastApplied ? `"${lastApplied.name}" ` : ''}전체 방 {part === 'floor' ? '바닥' : part === 'wall' ? '벽' : part === 'baseboard' ? '걸레받이' : part === 'ceiling' ? '천장' : '도어'} 일괄 적용
          </button>
        </div>
      </aside>
    </>
  );
}
