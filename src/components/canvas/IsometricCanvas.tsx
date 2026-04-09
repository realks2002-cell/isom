'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import type { FloorPlan } from '@/types/room';
import { render, type Selection } from '@/lib/renderer';
import { screenToIso, pointInPoly, toIso, fitCameraToBounds } from '@/lib/isometric';

interface Camera {
  x: number;
  y: number;
  zoom: number;
}

interface Props {
  floorPlan: FloorPlan;
  selection: Selection | null;
  onSelect: (sel: Selection | null) => void;
  initialCamera?: Camera;
  onCameraChange?: (cam: Camera) => void;
}

export function IsometricCanvas({
  floorPlan,
  selection,
  onSelect,
  initialCamera,
  onCameraChange,
}: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const [camera, setCamera] = useState<Camera>(
    initialCamera ?? { x: 0, y: 0, zoom: 1 }
  );

  useEffect(() => {
    onCameraChange?.(camera);
  }, [camera, onCameraChange]);
  const sizeRef = useRef({ w: 0, h: 0, dpr: 1 });
  const dragRef = useRef<{ sx: number; sy: number; cx: number; cy: number } | null>(null);
  const pinchRef = useRef<number>(0);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const { w, h, dpr } = sizeRef.current;
    render(ctx, { floorPlan, camera, selection, width: w, height: h, dpr });
  }, [floorPlan, camera, selection]);

  // 초기 auto-fit (initialCamera 없을 때)
  const fittedRef = useRef(false);
  useEffect(() => {
    if (fittedRef.current) return;
    if (initialCamera) {
      fittedRef.current = true;
      return;
    }
    if (floorPlan.rooms.length === 0) return;
    const wrap = wrapRef.current;
    if (!wrap) return;
    const rect = wrap.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) return;

    let minX = Infinity,
      minY = Infinity,
      maxX = -Infinity,
      maxY = -Infinity;
    for (const room of floorPlan.rooms) {
      for (const p of room.points) {
        const base = toIso(p.x, p.y);
        if (base.x < minX) minX = base.x;
        if (base.y < minY) minY = base.y;
        if (base.x > maxX) maxX = base.x;
        if (base.y > maxY) maxY = base.y;
        const top = toIso(p.x, p.y, room.wallHeight);
        if (top.y < minY) minY = top.y;
      }
    }
    if (!isFinite(minX)) return;
    const cam = fitCameraToBounds(
      { minX, minY, maxX, maxY },
      rect.width,
      rect.height,
      60
    );
    fittedRef.current = true;
    setCamera(cam);
  }, [floorPlan, initialCamera]);

  // 리사이즈
  useEffect(() => {
    const resize = () => {
      const canvas = canvasRef.current;
      const wrap = wrapRef.current;
      if (!canvas || !wrap) return;
      const rect = wrap.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      sizeRef.current = { w: rect.width, h: rect.height, dpr };
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      canvas.style.width = rect.width + 'px';
      canvas.style.height = rect.height + 'px';
      draw();
    };
    resize();
    window.addEventListener('resize', resize);
    return () => window.removeEventListener('resize', resize);
  }, [draw]);

  useEffect(() => {
    draw();
  }, [draw]);

  // 휠 줌 - non-passive로 직접 등록
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      const delta = e.deltaY > 0 ? 0.9 : 1.1;
      setCamera((c) => ({
        ...c,
        zoom: Math.max(0.3, Math.min(3, c.zoom * delta)),
      }));
    };
    canvas.addEventListener('wheel', onWheel, { passive: false });
    return () => canvas.removeEventListener('wheel', onWheel);
  }, []);

  // 터치 - non-passive move
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const onMove = (e: TouchEvent) => {
      if (e.touches.length === 1 && dragRef.current) {
        e.preventDefault();
        const t = e.touches[0];
        setCamera((c) => ({
          ...c,
          x: dragRef.current!.cx + (t.clientX - dragRef.current!.sx),
          y: dragRef.current!.cy + (t.clientY - dragRef.current!.sy),
        }));
      } else if (e.touches.length === 2) {
        e.preventDefault();
        const dx = e.touches[0].clientX - e.touches[1].clientX;
        const dy = e.touches[0].clientY - e.touches[1].clientY;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (pinchRef.current > 0) {
          const ratio = dist / pinchRef.current;
          setCamera((c) => ({
            ...c,
            zoom: Math.max(0.3, Math.min(3, c.zoom * ratio)),
          }));
        }
        pinchRef.current = dist;
      }
    };
    canvas.addEventListener('touchmove', onMove, { passive: false });
    return () => canvas.removeEventListener('touchmove', onMove);
  }, []);

  const hitTest = (clientX: number, clientY: number): Selection | null => {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    const rect = canvas.getBoundingClientRect();
    const sx = clientX - rect.left;
    const sy = clientY - rect.top;
    const { w, h } = sizeRef.current;
    const iso = screenToIso(sx, sy, w, h, camera);

    const sorted = [...floorPlan.rooms].sort((a, b) => {
      const aMin = Math.max(...a.points.map((p) => p.x + p.y));
      const bMin = Math.max(...b.points.map((p) => p.x + p.y));
      return bMin - aMin;
    });
    for (const room of sorted) {
      const poly = room.points.map((p) => toIso(p.x, p.y));
      if (pointInPoly(iso.x, iso.y, poly)) {
        return { roomId: room.id, part: 'floor' };
      }
    }
    // 방이 1개뿐이면 빈 공간 클릭도 해당 방 선택으로 처리
    if (floorPlan.rooms.length === 1) {
      return { roomId: floorPlan.rooms[0].id, part: 'floor' };
    }
    return null;
  };

  const onMouseDown = (e: React.MouseEvent) => {
    dragRef.current = { sx: e.clientX, sy: e.clientY, cx: camera.x, cy: camera.y };
  };
  const onMouseMove = (e: React.MouseEvent) => {
    if (!dragRef.current) return;
    setCamera((c) => ({
      ...c,
      x: dragRef.current!.cx + (e.clientX - dragRef.current!.sx),
      y: dragRef.current!.cy + (e.clientY - dragRef.current!.sy),
    }));
  };
  const onMouseUp = (e: React.MouseEvent) => {
    const d = dragRef.current;
    dragRef.current = null;
    if (!d) return;
    const moved = Math.abs(e.clientX - d.sx) + Math.abs(e.clientY - d.sy);
    if (moved < 4) {
      onSelect(hitTest(e.clientX, e.clientY));
    }
  };

  const onTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 1) {
      const t = e.touches[0];
      dragRef.current = { sx: t.clientX, sy: t.clientY, cx: camera.x, cy: camera.y };
    } else if (e.touches.length === 2) {
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      pinchRef.current = Math.sqrt(dx * dx + dy * dy);
    }
  };
  const onTouchEnd = (e: React.TouchEvent) => {
    const d = dragRef.current;
    dragRef.current = null;
    pinchRef.current = 0;
    if (!d) return;
    const t = e.changedTouches[0];
    if (!t) return;
    const moved = Math.abs(t.clientX - d.sx) + Math.abs(t.clientY - d.sy);
    if (moved < 6) {
      onSelect(hitTest(t.clientX, t.clientY));
    }
  };

  const resetCamera = () => setCamera({ x: 0, y: 0, zoom: 1 });

  return (
    <div ref={wrapRef} className="relative flex-1 overflow-hidden bg-neutral-100">
      <canvas
        ref={canvasRef}
        className="block w-full h-full touch-none select-none"
        onMouseDown={onMouseDown}
        onMouseMove={onMouseMove}
        onMouseUp={onMouseUp}
        onMouseLeave={() => (dragRef.current = null)}
        onTouchStart={onTouchStart}
        onTouchEnd={onTouchEnd}
      />
      <div className="absolute bottom-3 left-3 flex gap-2">
        <button
          onClick={() => setCamera((c) => ({ ...c, zoom: Math.min(3, c.zoom * 1.2) }))}
          className="bg-white rounded-lg border border-neutral-200 px-3 py-1.5 text-sm shadow-sm"
        >
          +
        </button>
        <button
          onClick={() => setCamera((c) => ({ ...c, zoom: Math.max(0.3, c.zoom * 0.8) }))}
          className="bg-white rounded-lg border border-neutral-200 px-3 py-1.5 text-sm shadow-sm"
        >
          −
        </button>
        <button
          onClick={resetCamera}
          className="bg-white rounded-lg border border-neutral-200 px-3 py-1.5 text-xs shadow-sm"
        >
          리셋
        </button>
      </div>
      <div className="absolute bottom-3 right-3 bg-white rounded-lg border border-neutral-200 px-3 py-1.5 text-xs text-neutral-600 shadow-sm">
        {Math.round(camera.zoom * 100)}%
      </div>
    </div>
  );
}
