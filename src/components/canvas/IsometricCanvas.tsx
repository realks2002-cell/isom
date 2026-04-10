'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import type { FloorPlan } from '@/types/room';
import { render, type Selection } from '@/lib/renderer';
import { screenToIso, pointInPoly, toIso, fitCameraToBounds, rotatePoint, unrotatePoint } from '@/lib/isometric';

interface Camera {
  x: number;
  y: number;
  zoom: number;
  rotation: number;
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
    initialCamera
      ? { ...initialCamera, rotation: initialCamera.rotation ?? 0 }
      : { x: 0, y: 0, zoom: 1, rotation: 0 }
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
    render(ctx, { floorPlan, camera, selection, width: w, height: h, dpr, rotation: camera.rotation });
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
        const rp = rotatePoint(p.x, p.y, camera.rotation);
        const base = toIso(rp.x, rp.y);
        if (base.x < minX) minX = base.x;
        if (base.y < minY) minY = base.y;
        if (base.x > maxX) maxX = base.x;
        if (base.y > maxY) maxY = base.y;
        const top = toIso(rp.x, rp.y, room.wallHeight);
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
    setCamera((prev) => ({ ...cam, rotation: prev.rotation }));
  }, [floorPlan, initialCamera]); // eslint-disable-line react-hooks/exhaustive-deps

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
    const rot = camera.rotation;
    const rIso = (x: number, y: number, z = 0) => {
      const rp = rotatePoint(x, y, rot);
      return toIso(rp.x, rp.y, z);
    };

    // 앞쪽 방부터 검사
    const sorted = [...floorPlan.rooms].sort((a, b) => {
      const aMin = Math.max(...a.points.map((p) => { const rp = rotatePoint(p.x, p.y, rot); return rp.x + rp.y; }));
      const bMin = Math.max(...b.points.map((p) => { const rp = rotatePoint(p.x, p.y, rot); return rp.x + rp.y; }));
      return bMin - aMin;
    });

    // 벽 면 가시성 판정: 이소메트릭에서 카메라는 (+1,+1) 방향에서 내려다봄
    // 벽 법선이 카메라 쪽을 향해야(= 보여야) 히트 테스트 대상
    const isWallVisible = (dx: number, dy: number) => {
      // 회전 적용된 벽 방향 벡터
      const r = rotatePoint(dx, dy, rot);
      // 벽의 바깥쪽 법선 (왼쪽 법선: (-dy, dx))
      const nx = -r.y;
      const ny = r.x;
      // 이소메트릭 카메라 방향 (+1, +1)과 내적 > 0이면 카메라를 향함
      return nx + ny > 0;
    };

    // 1) 벽 사다리꼴 — 렌더링에서 벽이 바닥 위에 그려지므로 먼저 검사
    for (const room of sorted) {
      const pts = room.points;
      for (let i = 0; i < pts.length; i++) {
        const p1 = pts[i];
        const p2 = pts[(i + 1) % pts.length];

        // 보이지 않는 벽은 히트 테스트 skip
        if (!isWallVisible(p2.x - p1.x, p2.y - p1.y)) continue;

        const b1 = rIso(p1.x, p1.y);
        const b2 = rIso(p2.x, p2.y);
        const t1 = rIso(p1.x, p1.y, room.wallHeight);
        const t2 = rIso(p2.x, p2.y, room.wallHeight);
        const quad = [b1, b2, t2, t1];
        if (!pointInPoly(iso.x, iso.y, quad)) continue;

        const dx = p2.x - p1.x;
        const dy = p2.y - p1.y;
        const len = Math.hypot(dx, dy);

        if (len > 0.01) {
          for (const d of floorPlan.doors) {
            const ddx = d.position.x - p1.x;
            const ddy = d.position.y - p1.y;
            const lenSq = dx * dx + dy * dy;
            const tProj = (ddx * dx + ddy * dy) / lenSq;
            const projX = p1.x + tProj * dx;
            const projY = p1.y + tProj * dy;
            const dist = Math.hypot(d.position.x - projX, d.position.y - projY);
            if (dist < 1.0 && tProj > 0 && tProj < 1) {
              const half = d.width / 2 / len;
              const tStart = Math.max(0, tProj - half);
              const tEnd = Math.min(1, tProj + half);
              const dq1 = rIso(p1.x + dx * tStart, p1.y + dy * tStart);
              const dq2 = rIso(p1.x + dx * tEnd, p1.y + dy * tEnd);
              const doorH = room.wallHeight * 0.75;
              const dt1 = rIso(p1.x + dx * tStart, p1.y + dy * tStart, doorH);
              const dt2 = rIso(p1.x + dx * tEnd, p1.y + dy * tEnd, doorH);
              const doorQuad = [dq1, dq2, dt2, dt1];
              if (pointInPoly(iso.x, iso.y, doorQuad)) {
                return { roomId: room.id, part: 'door' };
              }
            }
          }
        }

        const bbH = room.wallHeight * 0.25;
        const bb1 = rIso(p1.x, p1.y, bbH);
        const bb2 = rIso(p2.x, p2.y, bbH);
        const bbQuad = [b1, b2, bb2, bb1];
        if (pointInPoly(iso.x, iso.y, bbQuad)) {
          return { roomId: room.id, part: 'baseboard', wallIndex: i };
        }

        return { roomId: room.id, part: 'wall', wallIndex: i };
      }
    }

    // 2) 바닥 폴리곤
    for (const room of sorted) {
      const poly = room.points.map((p) => rIso(p.x, p.y));
      if (pointInPoly(iso.x, iso.y, poly)) {
        return { roomId: room.id, part: 'floor' };
      }
    }

    // 3) 천장 폴리곤 fallback
    for (const room of sorted) {
      const ceilingPoly = room.points.map((p) => rIso(p.x, p.y, room.wallHeight));
      if (pointInPoly(iso.x, iso.y, ceilingPoly)) {
        return { roomId: room.id, part: 'floor' };
      }
    }

    // 4) Fallback — 가장 가까운 edge
    const distToSegment = (px: number, py: number, x1: number, y1: number, x2: number, y2: number) => {
      const dx = x2 - x1;
      const dy = y2 - y1;
      const lenSq = dx * dx + dy * dy;
      if (lenSq < 1e-9) return Math.hypot(px - x1, py - y1);
      let t = ((px - x1) * dx + (py - y1) * dy) / lenSq;
      t = Math.max(0, Math.min(1, t));
      return Math.hypot(px - (x1 + t * dx), py - (y1 + t * dy));
    };
    let bestRoom: typeof sorted[number] | null = null;
    let bestDist = Infinity;
    for (const room of sorted) {
      const poly = room.points.map((p) => rIso(p.x, p.y));
      for (let i = 0; i < poly.length; i++) {
        const a = poly[i];
        const b = poly[(i + 1) % poly.length];
        const d = distToSegment(iso.x, iso.y, a.x, a.y, b.x, b.y);
        if (d < bestDist) {
          bestDist = d;
          bestRoom = room;
        }
      }
    }
    // 너무 멀면(80픽셀 이상) 무시 — 명백히 빈 영역 클릭
    if (bestRoom && bestDist < 80) {
      return { roomId: bestRoom.id, part: 'floor' };
    }

    // 5) 방이 1개뿐이면 빈 공간 클릭도 해당 방 floor 선택
    if (floorPlan.rooms.length === 1) {
      return { roomId: floorPlan.rooms[0].id, part: 'floor' };
    }
    return null;
  };

  // 2단계 클릭: 1클릭=전체, 2클릭=개별 벽면
  const handleHit = (hit: Selection | null) => {
    if (!hit) { onSelect(null); return; }

    const isWallLike = hit.part === 'wall' || hit.part === 'baseboard';

    if (isWallLike && selection?.roomId === hit.roomId && selection.part === hit.part) {
      if (selection.wallIndex === undefined) {
        // 전체 → 개별
        onSelect(hit);
      } else if (selection.wallIndex === hit.wallIndex) {
        // 같은 개별 벽 재클릭 → 전체로 돌아감
        onSelect({ roomId: hit.roomId, part: hit.part });
      } else {
        // 다른 개별 벽 클릭
        onSelect(hit);
      }
    } else {
      // 다른 방/파트 → 전체 선택 (wallIndex 제거)
      if (isWallLike) {
        onSelect({ roomId: hit.roomId, part: hit.part });
      } else {
        onSelect(hit);
      }
    }
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
      handleHit(hitTest(e.clientX, e.clientY));
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
      handleHit(hitTest(t.clientX, t.clientY));
    }
  };

  const resetCamera = () => setCamera({ x: 0, y: 0, zoom: 1, rotation: 0 });

  const rotate = (dir: 1 | -1) => {
    setCamera((c) => {
      const newRot = ((c.rotation + dir * 90) % 360 + 360) % 360;
      return { ...c, rotation: newRot };
    });
    // 회전 후 auto-fit
    setTimeout(() => {
      const wrap = wrapRef.current;
      if (!wrap || floorPlan.rooms.length === 0) return;
      const rect = wrap.getBoundingClientRect();
      if (rect.width === 0 || rect.height === 0) return;
      setCamera((c) => {
        let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
        for (const room of floorPlan.rooms) {
          for (const p of room.points) {
            const rp = rotatePoint(p.x, p.y, c.rotation);
            const base = toIso(rp.x, rp.y);
            if (base.x < minX) minX = base.x;
            if (base.y < minY) minY = base.y;
            if (base.x > maxX) maxX = base.x;
            if (base.y > maxY) maxY = base.y;
            const top = toIso(rp.x, rp.y, room.wallHeight);
            if (top.y < minY) minY = top.y;
          }
        }
        if (!isFinite(minX)) return c;
        const cam = fitCameraToBounds({ minX, minY, maxX, maxY }, rect.width, rect.height, 60);
        return { ...cam, rotation: c.rotation };
      });
    }, 0);
  };

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
          onClick={() => rotate(-1)}
          className="bg-white rounded-lg border border-neutral-200 px-3 py-1.5 text-sm shadow-sm"
          aria-label="반시계 회전"
        >
          ↺
        </button>
        <button
          onClick={() => rotate(1)}
          className="bg-white rounded-lg border border-neutral-200 px-3 py-1.5 text-sm shadow-sm"
          aria-label="시계 회전"
        >
          ↻
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
