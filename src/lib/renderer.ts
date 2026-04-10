import type {
  FloorPlan,
  Room,
  Door,
  Window,
  MaterialAssignment,
  PartType,
} from '@/types/room';
import { SCALE, toIso as _toIso, darken, polygonCenter, rotatePoint } from './isometric';
import type { Point2D } from '@/types/room';

let _rotation = 0;
function toIso(x: number, y: number, z = 0): Point2D {
  const r = rotatePoint(x, y, _rotation);
  return _toIso(r.x, r.y, z);
}
import { drawFloorPattern } from './patterns';

export interface Selection {
  roomId: string;
  part: PartType;
  wallIndex?: number;
}

export interface RenderState {
  floorPlan: FloorPlan;
  camera: { x: number; y: number; zoom: number };
  selection: Selection | null;
  width: number;
  height: number;
  dpr: number;
  rotation?: number;
  hideWalls?: boolean;
}

function sortRoomsBackToFront(rooms: Room[]): Room[] {
  return [...rooms].sort((a, b) => {
    const aMin = Math.min(...a.points.map((p) => { const r = rotatePoint(p.x, p.y, _rotation); return r.x + r.y; }));
    const bMin = Math.min(...b.points.map((p) => { const r = rotatePoint(p.x, p.y, _rotation); return r.x + r.y; }));
    return aMin - bMin;
  });
}

interface WallSide {
  side: 'back' | 'front' | 'left' | 'right';
}

// 벡터 각도 → 4방향 분류 (회전 반영)
function classifySide(dx: number, dy: number): WallSide['side'] {
  const r = rotatePoint(dx, dy, _rotation);
  const angle = Math.atan2(r.y, r.x);
  const deg = (angle * 180) / Math.PI;
  if (deg >= -45 && deg < 45) return 'back';
  if (deg >= 45 && deg < 135) return 'right';
  if (deg >= 135 || deg < -135) return 'front';
  return 'left';
}

function getPartitionFrameColor(color: string): { frame: string; frameDark: string } {
  switch (color) {
    case 'darkgray': return { frame: '#555555', frameDark: '#3a3a3a' };
    case 'white': return { frame: '#e0e0e0', frameDark: '#c0c0c0' };
    default: return { frame: '#1a1a1a', frameDark: '#000000' };
  }
}

function drawGlassPartition(
  ctx: CanvasRenderingContext2D,
  x1: number, y1: number, x2: number, y2: number,
  height: number,
  frameColor: { frame: string; frameDark: string }
) {
  const h = height * SCALE;
  const bp1 = toIso(x1, y1);
  const bp2 = toIso(x2, y2);
  const tp1 = { x: bp1.x, y: bp1.y - h };
  const tp2 = { x: bp2.x, y: bp2.y - h };

  // 하단 패널 (불투명, 높이 20%)
  const panelH = h * 0.15;
  const pp1 = { x: bp1.x, y: bp1.y - panelH };
  const pp2 = { x: bp2.x, y: bp2.y - panelH };

  ctx.beginPath();
  ctx.moveTo(bp1.x, bp1.y);
  ctx.lineTo(pp1.x, pp1.y);
  ctx.lineTo(pp2.x, pp2.y);
  ctx.lineTo(bp2.x, bp2.y);
  ctx.closePath();
  ctx.fillStyle = frameColor.frameDark;
  ctx.fill();

  // 유리 영역 (투명)
  ctx.beginPath();
  ctx.moveTo(pp1.x, pp1.y);
  ctx.lineTo(tp1.x, tp1.y);
  ctx.lineTo(tp2.x, tp2.y);
  ctx.lineTo(pp2.x, pp2.y);
  ctx.closePath();
  ctx.fillStyle = 'rgba(200, 220, 240, 0.08)';
  ctx.fill();

  // 외곽 프레임
  ctx.beginPath();
  ctx.moveTo(bp1.x, bp1.y);
  ctx.lineTo(tp1.x, tp1.y);
  ctx.lineTo(tp2.x, tp2.y);
  ctx.lineTo(bp2.x, bp2.y);
  ctx.closePath();
  ctx.strokeStyle = frameColor.frame;
  ctx.lineWidth = 2.5;
  ctx.stroke();

  // 세로 프레임 (일정 간격)
  const dx = x2 - x1;
  const dy = y2 - y1;
  const len = Math.sqrt(dx * dx + dy * dy);
  const divisionWidth = 0.9; // ~90cm 간격
  const divisions = Math.max(1, Math.round(len / divisionWidth));

  ctx.strokeStyle = frameColor.frame;
  ctx.lineWidth = 1.5;
  for (let i = 1; i < divisions; i++) {
    const t = i / divisions;
    const fx = x1 + dx * t;
    const fy = y1 + dy * t;
    const fb = toIso(fx, fy);
    const ft = { x: fb.x, y: fb.y - h };
    ctx.beginPath();
    ctx.moveTo(fb.x, fb.y);
    ctx.lineTo(ft.x, ft.y);
    ctx.stroke();
  }

  // 가로 프레임 (중간)
  const midH = h * 0.5;
  const ml = { x: bp1.x, y: bp1.y - midH };
  const mr = { x: bp2.x, y: bp2.y - midH };
  ctx.beginPath();
  ctx.moveTo(ml.x, ml.y);
  ctx.lineTo(mr.x, mr.y);
  ctx.stroke();
}

function drawWall(
  ctx: CanvasRenderingContext2D,
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  height: number,
  mat: MaterialAssignment,
  baseboardMat: MaterialAssignment,
  side: WallSide['side'],
  door: { posT: number; width: number } | null,
  win: { posT: number; width: number } | null,
  doorMat?: MaterialAssignment,
  highlightDoor?: boolean
) {
  const h = height * SCALE;
  const bp1 = toIso(x1, y1);
  const bp2 = toIso(x2, y2);
  const tp1 = { x: bp1.x, y: bp1.y - h };
  const tp2 = { x: bp2.x, y: bp2.y - h };

  let faceColor: string;
  let darkColor: string;
  if (side === 'left') {
    faceColor = darken(mat.color, 0.82);
    darkColor = darken(mat.color, 0.7);
  } else if (side === 'right') {
    faceColor = darken(mat.color, 0.92);
    darkColor = darken(mat.color, 0.8);
  } else {
    faceColor = mat.color;
    darkColor = darken(mat.color, 0.85);
  }

  // 벽면
  ctx.beginPath();
  ctx.moveTo(bp1.x, bp1.y);
  ctx.lineTo(tp1.x, tp1.y);
  ctx.lineTo(tp2.x, tp2.y);
  ctx.lineTo(bp2.x, bp2.y);
  ctx.closePath();
  ctx.fillStyle = faceColor;
  ctx.fill();
  ctx.strokeStyle = 'rgba(40,40,40,0.5)';
  ctx.lineWidth = 1;
  ctx.stroke();

  const dx = x2 - x1;
  const dy = y2 - y1;
  const len = Math.sqrt(dx * dx + dy * dy);

  if (win && len > 0.01) {
    const t1 = Math.max(0, win.posT);
    const t2 = Math.min(1, t1 + win.width / len);
    const wb1 = toIso(x1 + dx * t1, y1 + dy * t1);
    const wb2 = toIso(x1 + dx * t2, y1 + dy * t2);
    const winBottom = h * 0.35;
    const winTop = h * 0.8;

    ctx.beginPath();
    ctx.moveTo(wb1.x, wb1.y - winBottom);
    ctx.lineTo(wb1.x, wb1.y - winTop);
    ctx.lineTo(wb2.x, wb2.y - winTop);
    ctx.lineTo(wb2.x, wb2.y - winBottom);
    ctx.closePath();
    ctx.fillStyle = 'rgba(180,220,240,0.5)';
    ctx.fill();
    ctx.strokeStyle = darken(mat.color, 0.6);
    ctx.lineWidth = 1;
    ctx.stroke();

    // cross
    const mx = (wb1.x + wb2.x) / 2;
    ctx.beginPath();
    ctx.moveTo(mx, (wb1.y + wb2.y) / 2 - winBottom);
    ctx.lineTo(mx, (wb1.y + wb2.y) / 2 - winTop);
    ctx.strokeStyle = darken(mat.color, 0.5);
    ctx.lineWidth = 0.5;
    ctx.stroke();
  }

  if (door && len > 0.01) {
    const t1 = Math.max(0, door.posT);
    const t2 = Math.min(1, t1 + door.width / len);
    const db1 = toIso(x1 + dx * t1, y1 + dy * t1);
    const db2 = toIso(x1 + dx * t2, y1 + dy * t2);
    const doorH = h * 0.75;

    ctx.beginPath();
    ctx.moveTo(db1.x, db1.y);
    ctx.lineTo(db1.x, db1.y - doorH);
    ctx.lineTo(db2.x, db2.y - doorH);
    ctx.lineTo(db2.x, db2.y);
    ctx.closePath();
    ctx.fillStyle = doorMat?.color ?? darken(mat.color, 0.55);
    ctx.fill();
    ctx.strokeStyle = darken(doorMat?.color ?? mat.color, 0.5);
    ctx.lineWidth = 1.2;
    ctx.stroke();

    if (highlightDoor) {
      ctx.beginPath();
      ctx.moveTo(db1.x, db1.y);
      ctx.lineTo(db1.x, db1.y - doorH);
      ctx.lineTo(db2.x, db2.y - doorH);
      ctx.lineTo(db2.x, db2.y);
      ctx.closePath();
      ctx.fillStyle = 'rgba(233,69,96,0.5)';
      ctx.fill();
      ctx.strokeStyle = '#e94560';
      ctx.lineWidth = 3;
      ctx.stroke();
    }
  }

  // 벽 상단 강조 라인
  ctx.beginPath();
  ctx.moveTo(tp1.x, tp1.y);
  ctx.lineTo(tp2.x, tp2.y);
  ctx.strokeStyle = 'rgba(30,30,30,0.8)';
  ctx.lineWidth = 2;
  ctx.stroke();

  // 걸레받이 — room.baseboard 자재 사용
  const bbH = h * 0.05;
  ctx.beginPath();
  ctx.moveTo(bp1.x, bp1.y);
  ctx.lineTo(bp1.x, bp1.y - bbH);
  ctx.lineTo(bp2.x, bp2.y - bbH);
  ctx.lineTo(bp2.x, bp2.y);
  ctx.closePath();
  ctx.fillStyle = baseboardMat.color;
  ctx.fill();
  ctx.strokeStyle = 'rgba(30,30,30,0.6)';
  ctx.lineWidth = 0.8;
  ctx.stroke();
}

// 선분 위 점 투영: (t, 수직거리). t는 [0,1] clamp 전 원시값.
function projectPointOnSegment(
  px: number,
  py: number,
  x1: number,
  y1: number,
  x2: number,
  y2: number
): { t: number; dist: number } {
  const dx = x2 - x1;
  const dy = y2 - y1;
  const lenSq = dx * dx + dy * dy;
  if (lenSq < 1e-9) return { t: 0, dist: Infinity };
  const t = ((px - x1) * dx + (py - y1) * dy) / lenSq;
  const projX = x1 + t * dx;
  const projY = y1 + t * dy;
  const dist = Math.hypot(px - projX, py - projY);
  return { t, dist };
}

const OPENING_TOLERANCE = 0.3; // meter

function matchDoorForSegment(
  doors: Door[],
  x1: number,
  y1: number,
  x2: number,
  y2: number
): { posT: number; width: number } | null {
  const len = Math.hypot(x2 - x1, y2 - y1);
  if (len < 1e-6) return null;
  for (const d of doors) {
    const { t, dist } = projectPointOnSegment(d.position.x, d.position.y, x1, y1, x2, y2);
    if (dist < OPENING_TOLERANCE && t > 0 && t < 1) {
      const half = d.width / 2 / len;
      return { posT: Math.max(0, t - half), width: d.width };
    }
  }
  return null;
}

function matchWindowForSegment(
  windows: Window[],
  roomId: string,
  x1: number,
  y1: number,
  x2: number,
  y2: number
): { posT: number; width: number } | null {
  const len = Math.hypot(x2 - x1, y2 - y1);
  if (len < 1e-6) return null;
  for (const w of windows) {
    if (w.roomId !== roomId) continue;
    const { t, dist } = projectPointOnSegment(w.position.x, w.position.y, x1, y1, x2, y2);
    if (dist < OPENING_TOLERANCE && t > 0 && t < 1) {
      const half = w.width / 2 / len;
      return { posT: Math.max(0, t - half), width: w.width };
    }
  }
  return null;
}

function drawWallTopCaps(ctx: CanvasRenderingContext2D, room: Room) {
  const pts = room.points;
  const h = room.wallHeight;
  const thick = 0.12;
  const n = pts.length;

  // 각 꼭짓점에서 마이터 오프셋 계산
  const offsets: Point2D[] = [];
  for (let i = 0; i < n; i++) {
    const prev = pts[(i - 1 + n) % n];
    const curr = pts[i];
    const next = pts[(i + 1) % n];

    const d1x = curr.x - prev.x;
    const d1y = curr.y - prev.y;
    const len1 = Math.hypot(d1x, d1y);
    const d2x = next.x - curr.x;
    const d2y = next.y - curr.y;
    const len2 = Math.hypot(d2x, d2y);

    if (len1 < 1e-6 || len2 < 1e-6) {
      offsets.push({ x: curr.x, y: curr.y });
      continue;
    }

    // 두 변의 법선 (바깥쪽)
    const n1x = -d1y / len1;
    const n1y = d1x / len1;
    const n2x = -d2y / len2;
    const n2y = d2x / len2;

    // 평균 법선
    let mx = n1x + n2x;
    let my = n1y + n2y;
    const ml = Math.hypot(mx, my);
    if (ml < 1e-6) {
      mx = n1x;
      my = n1y;
    } else {
      // 마이터 길이 보정: thick / cos(half-angle)
      const dot = n1x * mx / ml + n1y * my / ml;
      const scale = dot > 0.1 ? thick / dot : thick;
      mx = (mx / ml) * scale;
      my = (my / ml) * scale;
    }

    offsets.push({ x: curr.x + mx, y: curr.y + my });
  }

  for (let i = 0; i < n; i++) {
    const p1 = pts[i];
    const p2 = pts[(i + 1) % n];
    const o1 = offsets[i];
    const o2 = offsets[(i + 1) % n];

    const tp1 = toIso(p1.x, p1.y, h);
    const tp2 = toIso(p2.x, p2.y, h);
    const tp3 = toIso(o2.x, o2.y, h);
    const tp4 = toIso(o1.x, o1.y, h);

    ctx.beginPath();
    ctx.moveTo(tp1.x, tp1.y);
    ctx.lineTo(tp2.x, tp2.y);
    ctx.lineTo(tp3.x, tp3.y);
    ctx.lineTo(tp4.x, tp4.y);
    ctx.closePath();
    ctx.fillStyle = '#2a2a2a';
    ctx.fill();
  }
}

export function render(ctx: CanvasRenderingContext2D, state: RenderState) {
  const { floorPlan, camera, selection, width, height, dpr } = state;
  _rotation = state.rotation ?? 0;

  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.clearRect(0, 0, width * dpr, height * dpr);

  ctx.setTransform(
    dpr * camera.zoom,
    0,
    0,
    dpr * camera.zoom,
    (width / 2) * dpr + camera.x * dpr,
    (height / 2.5) * dpr + camera.y * dpr
  );

  const sorted = sortRoomsBackToFront(floorPlan.rooms);

  // 1) 바닥
  for (const room of sorted) {
    drawFloorPattern(ctx, room.points, room.floor, _rotation);

    // 바닥 하이라이트는 벽 뒤에서 안 보이므로 벽 렌더링 후에 그림 (아래 별도 패스)

    const c = polygonCenter(room.points);
    const cp = toIso(c.x, c.y);
    ctx.font = '500 11px "Noto Sans KR", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillStyle = 'rgba(0,0,0,0.45)';
    ctx.fillText(room.name, cp.x, cp.y + 4);
  }

  // 2) 벽 (hideWalls 시 스킵)
  if (state.hideWalls) {
    console.log('[render] hideWalls=true, skipping walls');
  } else
  for (const room of sorted) {
    const pts = room.points;
    for (let i = 0; i < pts.length; i++) {
      const p1 = pts[i];
      const p2 = pts[(i + 1) % pts.length];
      const side = classifySide(p2.x - p1.x, p2.y - p1.y);
      const door = matchDoorForSegment(floorPlan.doors, p1.x, p1.y, p2.x, p2.y);
      const win = matchWindowForSegment(floorPlan.windows, room.id, p1.x, p1.y, p2.x, p2.y);
      const highlightDoor = selection?.roomId === room.id && selection.part === 'door';
      const wallMat = room.walls?.[i] ?? room.wall;
      drawWall(ctx, p1.x, p1.y, p2.x, p2.y, room.wallHeight, wallMat, room.baseboard, side, door, win, room.door, highlightDoor);
    }

    // 벽/걸레받이 선택 하이라이트
    if (selection?.roomId === room.id && (selection.part === 'wall' || selection.part === 'baseboard')) {
      for (let i = 0; i < pts.length; i++) {
        if (selection.wallIndex !== undefined && selection.wallIndex !== i) continue;

        const p1 = pts[i];
        const p2 = pts[(i + 1) % pts.length];
        const b1 = toIso(p1.x, p1.y);
        const b2 = toIso(p2.x, p2.y);
        const t1 = toIso(p1.x, p1.y, room.wallHeight);
        const t2 = toIso(p2.x, p2.y, room.wallHeight);

        // 클리핑 + 빗금
        ctx.save();
        ctx.beginPath();
        ctx.moveTo(b1.x, b1.y);
        ctx.lineTo(b2.x, b2.y);
        ctx.lineTo(t2.x, t2.y);
        ctx.lineTo(t1.x, t1.y);
        ctx.closePath();
        ctx.clip();

        const wMinX = Math.min(b1.x, b2.x, t1.x, t2.x);
        const wMinY = Math.min(b1.y, b2.y, t1.y, t2.y);
        const wMaxX = Math.max(b1.x, b2.x, t1.x, t2.x);
        const wMaxY = Math.max(b1.y, b2.y, t1.y, t2.y);

        ctx.strokeStyle = 'rgba(220,50,60,0.35)';
        ctx.lineWidth = 1;
        const gap = 8;
        const wRange = (wMaxX - wMinX) + (wMaxY - wMinY);
        for (let d = -wRange; d < wRange; d += gap) {
          ctx.beginPath();
          ctx.moveTo(wMinX + d, wMinY);
          ctx.lineTo(wMinX + d + (wMaxY - wMinY), wMaxY);
          ctx.stroke();
        }

        ctx.fillStyle = 'rgba(220,50,60,0.10)';
        ctx.fillRect(wMinX, wMinY, wMaxX - wMinX, wMaxY - wMinY);
        ctx.restore();

        // 테두리
        ctx.beginPath();
        ctx.moveTo(b1.x, b1.y);
        ctx.lineTo(b2.x, b2.y);
        ctx.lineTo(t2.x, t2.y);
        ctx.lineTo(t1.x, t1.y);
        ctx.closePath();
        ctx.strokeStyle = '#dc323c';
        ctx.lineWidth = selection.wallIndex !== undefined ? 3.5 : 2.5;
        ctx.stroke();
      }
    }
  }

  // 3) 내부 벽 (LINE 세그먼트) — 인접 방의 벽 자재를 따름
  if (!state.hideWalls && floorPlan.internalWalls && floorPlan.internalWalls.length > 0) {
    const defaultHeight = sorted[0]?.wallHeight ?? 2.7;

    // 세그먼트 중점에서 가장 가까운 방 찾기
    const findNearestRoom = (mx: number, my: number) => {
      let best = sorted[0];
      let bestDist = Infinity;
      for (const room of sorted) {
        let cx = 0, cy = 0;
        for (const p of room.points) { cx += p.x; cy += p.y; }
        cx /= room.points.length; cy /= room.points.length;
        const d = Math.hypot(mx - cx, my - cy);
        if (d < bestDist) { bestDist = d; best = room; }
      }
      return best;
    };

    // Z-정렬: 뒤쪽 세그먼트부터
    const sortedSegs = [...floorPlan.internalWalls].sort((a, b) => {
      const ra1 = rotatePoint(a.a.x, a.a.y, _rotation);
      const ra2 = rotatePoint(a.b.x, a.b.y, _rotation);
      const rb1 = rotatePoint(b.a.x, b.a.y, _rotation);
      const rb2 = rotatePoint(b.b.x, b.b.y, _rotation);
      const aMin = Math.min(ra1.x + ra1.y, ra2.x + ra2.y);
      const bMin = Math.min(rb1.x + rb1.y, rb2.x + rb2.y);
      return aMin - bMin;
    });
    for (const seg of sortedSegs) {
      if (seg.partition) {
        // 유리 파티션 렌더링
        const frameColor = getPartitionFrameColor(seg.partitionColor ?? floorPlan.partitionColor ?? 'black');
        drawGlassPartition(ctx, seg.a.x, seg.a.y, seg.b.x, seg.b.y, defaultHeight, frameColor);
        continue;
      }

      const mx = (seg.a.x + seg.b.x) / 2;
      const my = (seg.a.y + seg.b.y) / 2;
      const nearest = findNearestRoom(mx, my);
      const wallMat = nearest?.wall ?? { materialId: '', color: '#ece6dc', patternType: 'solid' as const };
      const bbMat = nearest?.baseboard ?? wallMat;
      const doorMat = nearest?.door;

      const side = classifySide(seg.b.x - seg.a.x, seg.b.y - seg.a.y);
      const door = matchDoorForSegment(floorPlan.doors, seg.a.x, seg.a.y, seg.b.x, seg.b.y);
      let win: { posT: number; width: number } | null = null;
      const len = Math.hypot(seg.b.x - seg.a.x, seg.b.y - seg.a.y);
      if (len > 0.01) {
        for (const w of floorPlan.windows) {
          const dx = seg.b.x - seg.a.x;
          const dy = seg.b.y - seg.a.y;
          const lenSq = dx * dx + dy * dy;
          const t = ((w.position.x - seg.a.x) * dx + (w.position.y - seg.a.y) * dy) / lenSq;
          const projX = seg.a.x + t * dx;
          const projY = seg.a.y + t * dy;
          const dist = Math.hypot(w.position.x - projX, w.position.y - projY);
          if (dist < 0.3 && t > 0 && t < 1) {
            const half = w.width / 2 / len;
            win = { posT: Math.max(0, t - half), width: w.width };
            break;
          }
        }
      }
      drawWall(ctx, seg.a.x, seg.a.y, seg.b.x, seg.b.y, defaultHeight, wallMat, bbMat, side, door, win, doorMat);
    }
  }

  // 4) 벽 상단 캡
  if (!state.hideWalls) {
    for (const room of sorted) {
      drawWallTopCaps(ctx, room);
    }
  }

  // 5) 바닥 하이라이트 — 벽 위에 그려야 보임
  if (selection?.part === 'floor') {
    for (const room of sorted) {
      if (selection.roomId !== room.id) continue;
      const iso = room.points.map((p) => toIso(p.x, p.y));

      // 클리핑
      ctx.save();
      ctx.beginPath();
      iso.forEach((p, i) => (i === 0 ? ctx.moveTo(p.x, p.y) : ctx.lineTo(p.x, p.y)));
      ctx.closePath();
      ctx.clip();

      // bounds를 충분히 넓게
      let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
      for (const p of iso) {
        if (p.x < minX) minX = p.x;
        if (p.y < minY) minY = p.y;
        if (p.x > maxX) maxX = p.x;
        if (p.y > maxY) maxY = p.y;
      }
      const pad = 50;
      minX -= pad; minY -= pad; maxX += pad; maxY += pad;

      // 반투명 붉은 오버레이
      ctx.fillStyle = 'rgba(220,50,60,0.15)';
      ctx.fillRect(minX, minY, maxX - minX, maxY - minY);

      // 대각선 빗금
      ctx.strokeStyle = 'rgba(220,50,60,0.4)';
      ctx.lineWidth = 1.5;
      const gap = 6;
      const totalRange = (maxX - minX) + (maxY - minY);
      for (let d = 0; d < totalRange; d += gap) {
        ctx.beginPath();
        ctx.moveTo(minX + d, minY);
        ctx.lineTo(minX + d - (maxY - minY), maxY);
        ctx.stroke();
      }

      ctx.restore();

      // 붉은 테두리
      ctx.beginPath();
      iso.forEach((p, i) => (i === 0 ? ctx.moveTo(p.x, p.y) : ctx.lineTo(p.x, p.y)));
      ctx.closePath();
      ctx.strokeStyle = '#dc323c';
      ctx.lineWidth = 3;
      ctx.stroke();
    }
  }

}

// ─── 히트맵 (color picking) ───

function encodeHitColor(roomIdx: number, part: PartType, wallIndex: number): string {
  // R = (roomIdx+1)*8, G = partCode*50, B = (wallIndex+1)*8
  // 값을 크게 해서 안티앨리어싱에 의한 색 혼합 영향을 줄임
  const partCode: Record<string, number> = { floor: 1, wall: 2, baseboard: 3, door: 5 };
  const r = Math.min(255, (roomIdx + 1) * 8);
  const g = (partCode[part] ?? 0) * 50;
  const b = Math.min(255, (wallIndex + 1) * 8);
  return `rgb(${r},${g},${b})`;
}

export function decodeHitColor(r: number, g: number, b: number): { roomIdx: number; part: PartType; wallIndex: number } | null {
  if (r < 4 && g < 25 && b < 4) return null; // 배경 (검정 근처)
  const partMap: Record<number, PartType> = { 1: 'floor', 2: 'wall', 3: 'baseboard', 5: 'door' };
  // g 값에서 partCode 역산 (50 단위 반올림)
  const partCode = Math.round(g / 50);
  const part = partMap[partCode];
  if (!part) return null;
  const roomIdx = Math.round(r / 8) - 1;
  const wallIndex = Math.round(b / 8) - 1;
  if (roomIdx < 0) return null;
  return { roomIdx, part, wallIndex };
}

export function renderHitmap(ctx: CanvasRenderingContext2D, state: RenderState) {
  const { floorPlan, camera, width, height, dpr } = state;
  _rotation = state.rotation ?? 0;

  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.clearRect(0, 0, width * dpr, height * dpr);
  ctx.imageSmoothingEnabled = false;
  // render()와 동일한 transform
  ctx.setTransform(
    dpr * camera.zoom,
    0,
    0,
    dpr * camera.zoom,
    (width / 2) * dpr + camera.x * dpr,
    (height / 2.5) * dpr + camera.y * dpr
  );

  const sorted = sortRoomsBackToFront(floorPlan.rooms);
  console.log('[renderHitmap] rooms:', sorted.length, 'w:', width, 'h:', height, 'zoom:', camera.zoom);

  // DEBUG: 첫 번째 방의 바닥을 밝은 빨간색으로 직접 그려서 확인
  if (sorted.length > 0) {
    const testRoom = sorted[0];
    const testIso = testRoom.points.map((p) => toIso(p.x, p.y));
    ctx.beginPath();
    testIso.forEach((p, i) => (i === 0 ? ctx.moveTo(p.x, p.y) : ctx.lineTo(p.x, p.y)));
    ctx.closePath();
    ctx.fillStyle = 'rgb(255,0,0)';
    ctx.fill();
    console.log('[renderHitmap] DEBUG drew red floor at:', testIso.map(p => `(${p.x.toFixed(0)},${p.y.toFixed(0)})`).join(' '));
  }

  // 1) 바닥
  for (let ri = 0; ri < sorted.length; ri++) {
    const room = sorted[ri];
    const roomIdx = floorPlan.rooms.indexOf(room);
    const iso = room.points.map((p) => toIso(p.x, p.y));
    ctx.beginPath();
    iso.forEach((p, i) => (i === 0 ? ctx.moveTo(p.x, p.y) : ctx.lineTo(p.x, p.y)));
    ctx.closePath();
    ctx.fillStyle = encodeHitColor(roomIdx, 'floor', 0);
    ctx.fill();
  }

  // 2) 벽 — 보이는 벽만 (카메라 방향 체크)
  for (let ri = 0; ri < sorted.length; ri++) {
    const room = sorted[ri];
    const roomIdx = floorPlan.rooms.indexOf(room);
    const pts = room.points;
    for (let i = 0; i < pts.length; i++) {
      const p1 = pts[i];
      const p2 = pts[(i + 1) % pts.length];

      // 보이지 않는 벽 skip
      const dx = p2.x - p1.x;
      const dy = p2.y - p1.y;
      const rr = rotatePoint(dx, dy, _rotation);
      const nx = -rr.y, ny = rr.x;
      if (nx + ny <= 0) continue;

      const h = room.wallHeight * SCALE;
      const bp1 = toIso(p1.x, p1.y);
      const bp2 = toIso(p2.x, p2.y);
      const tp1 = { x: bp1.x, y: bp1.y - h };
      const tp2 = { x: bp2.x, y: bp2.y - h };

      ctx.beginPath();
      ctx.moveTo(bp1.x, bp1.y);
      ctx.lineTo(bp2.x, bp2.y);
      ctx.lineTo(tp2.x, tp2.y);
      ctx.lineTo(tp1.x, tp1.y);
      ctx.closePath();
      ctx.fillStyle = encodeHitColor(roomIdx, 'wall', i);
      ctx.fill();
    }
  }
}
