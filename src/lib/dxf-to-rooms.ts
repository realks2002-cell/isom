import type { FloorPlan, Point2D, Room, Door, Window, MaterialAssignment, WallSegment } from '@/types/room';
import type { ParsedDxf, ArchPart } from './dxf/parser';
import { DEFAULT_MATERIALS, type BuildingType } from './building-types';

export interface LayerMapping {
  [layerName: string]: ArchPart;
}

interface Segment {
  a: Point2D;
  b: Point2D;
}

const DEFAULT_MATERIAL: MaterialAssignment = {
  materialId: '',
  color: '#e5e5e5',
  patternType: 'solid',
};

import type { DxfUnit } from './dxf/parser';

function unitScale(unit: DxfUnit): number {
  // 내부 단위: meter 기준
  switch (unit) {
    case 'mm':
      return 0.001;
    case 'cm':
      return 0.01;
    case 'm':
      return 1;
    case 'inch':
      return 0.0254;
    case 'feet':
      return 0.3048;
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function extractSegments(entities: any[], wallLayers: Set<string>): Segment[] {
  const segs: Segment[] = [];
  for (const e of entities) {
    if (!wallLayers.has(e.layer)) continue;
    const type = e.type;

    if (type === 'LINE' && e.vertices?.length >= 2) {
      const [a, b] = e.vertices;
      segs.push({ a: { x: a.x, y: a.y }, b: { x: b.x, y: b.y } });
    } else if ((type === 'LWPOLYLINE' || type === 'POLYLINE') && e.vertices?.length >= 2) {
      const verts = e.vertices;
      for (let i = 0; i < verts.length - 1; i++) {
        segs.push({
          a: { x: verts[i].x, y: verts[i].y },
          b: { x: verts[i + 1].x, y: verts[i + 1].y },
        });
      }
      if (e.shape || e.closed) {
        segs.push({
          a: { x: verts[verts.length - 1].x, y: verts[verts.length - 1].y },
          b: { x: verts[0].x, y: verts[0].y },
        });
      }
    }
    // ARC는 Phase 2에서 무시
  }
  return segs;
}

function segmentsBounds(segs: Segment[]): {
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
} {
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  for (const s of segs) {
    for (const p of [s.a, s.b]) {
      if (p.x < minX) minX = p.x;
      if (p.y < minY) minY = p.y;
      if (p.x > maxX) maxX = p.x;
      if (p.y > maxY) maxY = p.y;
    }
  }
  return { minX, minY, maxX, maxY };
}

function normalizeSegments(segs: Segment[], scale: number): Segment[] {
  if (segs.length === 0) return [];
  const { minX, minY, maxX, maxY } = segmentsBounds(segs);
  const cx = (minX + maxX) / 2;
  const cy = (minY + maxY) / 2;
  return segs.map((s) => ({
    a: { x: (s.a.x - cx) * scale, y: (s.a.y - cy) * scale },
    b: { x: (s.b.x - cx) * scale, y: (s.b.y - cy) * scale },
  }));
}

// 닫힌 POLYLINE 한 개 = 방 하나로 간주하는 간단한 전략.
// (정식 영역 감지는 Phase 3/리팩토링 단계에서 개선)
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function extractRoomPolygons(entities: any[], wallLayers: Set<string>): Point2D[][] {
  const polys: Point2D[][] = [];
  for (const e of entities) {
    if (!wallLayers.has(e.layer)) continue;
    if ((e.type === 'LWPOLYLINE' || e.type === 'POLYLINE') && (e.shape || e.closed) && e.vertices?.length >= 3) {
      polys.push(e.vertices.map((v: { x: number; y: number }) => ({ x: v.x, y: v.y })));
    }
  }
  return polys;
}

function polygonCenter(pts: Point2D[]): Point2D {
  let x = 0;
  let y = 0;
  for (const p of pts) {
    x += p.x;
    y += p.y;
  }
  return { x: x / pts.length, y: y / pts.length };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function extractPoints(entities: any[], layers: Set<string>): Point2D[] {
  const out: Point2D[] = [];
  for (const e of entities) {
    if (!layers.has(e.layer)) continue;
    if (e.type === 'INSERT' && e.position) {
      out.push({ x: e.position.x, y: e.position.y });
    } else if (e.type === 'LINE' && e.vertices?.length >= 2) {
      const [a, b] = e.vertices;
      out.push({ x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 });
    }
  }
  return out;
}

/** 근접한 점 중복 제거 (threshold 단위는 입력 좌표계) */
function dedupePoints(points: Point2D[], threshold: number): Point2D[] {
  const result: Point2D[] = [];
  for (const p of points) {
    const dup = result.some(
      (q) => Math.hypot(q.x - p.x, q.y - p.y) < threshold
    );
    if (!dup) result.push(p);
  }
  return result;
}

export function buildFloorPlan(parsed: ParsedDxf, mapping: LayerMapping, buildingType: BuildingType = 'apartment'): FloorPlan {
  const scale = unitScale(parsed.unit);
  const wallLayers = new Set<string>();
  const doorLayers = new Set<string>();
  const windowLayers = new Set<string>();
  const partitionLayers = new Set<string>();

  for (const [name, part] of Object.entries(mapping)) {
    if (part === 'wall') wallLayers.add(name);
    else if (part === 'door') doorLayers.add(name);
    else if (part === 'window') windowLayers.add(name);
    else if (part === 'partition') partitionLayers.add(name);
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const entities: any[] = parsed.raw.entities ?? [];
  const rawPolys = extractRoomPolygons(entities, wallLayers);

  const rawSegs = extractSegments(entities, wallLayers);
  const allPts: Point2D[] = [
    ...rawSegs.flatMap((s) => [s.a, s.b]),
    ...rawPolys.flat(),
  ];
  if (allPts.length === 0) {
    return { rooms: [], doors: [], windows: [] };
  }
  let minX = Infinity,
    minY = Infinity,
    maxX = -Infinity,
    maxY = -Infinity;
  for (const p of allPts) {
    if (p.x < minX) minX = p.x;
    if (p.y < minY) minY = p.y;
    if (p.x > maxX) maxX = p.x;
    if (p.y > maxY) maxY = p.y;
  }
  const cx = (minX + maxX) / 2;
  const cy = (minY + maxY) / 2;
  // header 단위가 틀릴 수 있어 bbox 크기 기반 자동 보정
  let effectiveScale = scale;
  const bboxLongSide = Math.max(maxX - minX, maxY - minY) * scale;
  if (bboxLongSide > 500) {
    // >500m → 실제는 mm 단위일 가능성
    effectiveScale = scale * 0.001;
  } else if (bboxLongSide > 50) {
    // 50~500m → cm 단위일 가능성
    effectiveScale = scale * 0.01;
  }
  const normalize = (p: Point2D) => ({
    x: (p.x - cx) * effectiveScale,
    y: (p.y - cy) * effectiveScale,
  });

  // 내부 벽 세그먼트: rawSegs 중 폴리곤에 속하지 않는 것
  const polyEdgeKeys = new Set<string>();
  const roundKey = (a: Point2D, b: Point2D) => {
    const r = (n: number) => Math.round(n * 100) / 100;
    const k1 = `${r(a.x)},${r(a.y)}|${r(b.x)},${r(b.y)}`;
    const k2 = `${r(b.x)},${r(b.y)}|${r(a.x)},${r(a.y)}`;
    return [k1, k2];
  };
  for (const poly of rawPolys) {
    for (let i = 0; i < poly.length; i++) {
      const a = poly[i];
      const b = poly[(i + 1) % poly.length];
      const [k1, k2] = roundKey(a, b);
      polyEdgeKeys.add(k1);
      polyEdgeKeys.add(k2);
    }
  }
  const internalWalls: WallSegment[] = [];
  for (const seg of rawSegs) {
    const [k1] = roundKey(seg.a, seg.b);
    if (polyEdgeKeys.has(k1)) continue;
    // 길이 0 세그먼트 스킵
    const dx = seg.b.x - seg.a.x;
    const dy = seg.b.y - seg.a.y;
    if (dx * dx + dy * dy < 1e-6) continue;
    internalWalls.push({
      a: normalize(seg.a),
      b: normalize(seg.b),
    });
  }

  const mat = DEFAULT_MATERIALS[buildingType];
  const rooms: Room[] = rawPolys.map((poly, i) => ({
    id: `room-${i}`,
    name: `공간 ${i + 1}`,
    points: poly.map(normalize),
    wallHeight: 2.4,
    floor: { ...mat.floor },
    wall: { ...mat.wall },
    baseboard: { ...mat.baseboard },
    ceiling: { ...mat.ceiling },
    door: { ...mat.door },
  }));

  // 문/창 간단 추출 + 근접 중복 제거 (원본 좌표계에서 50cm 기준 = 500mm)
  const dedupeThreshold = 0.5 / effectiveScale;
  const doorPts = dedupePoints(extractPoints(entities, doorLayers), dedupeThreshold);
  const windowPts = dedupePoints(extractPoints(entities, windowLayers), dedupeThreshold);

  const doors: Door[] = doorPts.map((p, i) => {
    const norm = normalize(p);
    return {
      id: `door-${i}`,
      position: norm,
      direction: 'h',
      width: 0.9,
      connectsRooms: ['', ''],
    };
  });

  const windows: Window[] = windowPts.map((p, i) => {
    const norm = normalize(p);
    // 가장 가까운 방 ID 찾기
    let nearest = rooms[0]?.id ?? '';
    let best = Infinity;
    for (const r of rooms) {
      const c = polygonCenter(r.points);
      const d = (c.x - norm.x) ** 2 + (c.y - norm.y) ** 2;
      if (d < best) {
        best = d;
        nearest = r.id;
      }
    }
    return {
      id: `window-${i}`,
      position: norm,
      direction: 'h',
      width: 1.2,
      roomId: nearest,
    };
  });

  // 칸막이 세그먼트 추출 (반높이 벽)
  const partitionSegs = extractSegments(entities, partitionLayers);
  const partitionWalls: WallSegment[] = [];
  for (const seg of partitionSegs) {
    const dx = seg.b.x - seg.a.x;
    const dy = seg.b.y - seg.a.y;
    if (dx * dx + dy * dy < 1e-6) continue;
    partitionWalls.push({
      a: normalize(seg.a),
      b: normalize(seg.b),
      height: 1.2,
    });
  }

  const allInternalWalls = [...internalWalls, ...partitionWalls];

  return { rooms, doors, windows, internalWalls: allInternalWalls, buildingType };
}
