import type { Point2D } from '@/types/room';

export const SCALE = 38;

export function rotatePoint(x: number, y: number, rotation: number): Point2D {
  switch (((rotation % 360) + 360) % 360) {
    case 90:  return { x: -y, y: x };
    case 180: return { x: -x, y: -y };
    case 270: return { x: y, y: -x };
    default:  return { x, y };
  }
}

export function unrotatePoint(x: number, y: number, rotation: number): Point2D {
  return rotatePoint(x, y, (360 - ((rotation % 360) + 360) % 360) % 360);
}

export function toIso(x: number, y: number, z = 0): Point2D {
  return {
    x: (x - y) * SCALE * 0.866,
    y: (x + y) * SCALE * 0.5 - z * SCALE,
  };
}

/** 화면 좌표(canvas 내부 px, DPR 미적용) → 이소메트릭 공간 좌표 */
export function screenToIso(
  sx: number,
  sy: number,
  canvasW: number,
  canvasH: number,
  cam: { x: number; y: number; zoom: number }
): Point2D {
  return {
    x: (sx - canvasW / 2 - cam.x) / cam.zoom,
    y: (sy - canvasH / 2.5 - cam.y) / cam.zoom,
  };
}

export function pointInPoly(px: number, py: number, poly: Point2D[]): boolean {
  let inside = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const xi = poly[i].x;
    const yi = poly[i].y;
    const xj = poly[j].x;
    const yj = poly[j].y;
    if (yi > py !== yj > py && px < ((xj - xi) * (py - yi)) / (yj - yi) + xi) {
      inside = !inside;
    }
  }
  return inside;
}

function parseHex(hex: string): [number, number, number] {
  const h = hex.replace('#', '');
  return [
    parseInt(h.slice(0, 2), 16),
    parseInt(h.slice(2, 4), 16),
    parseInt(h.slice(4, 6), 16),
  ];
}

export function darken(hex: string, factor: number): string {
  const [r, g, b] = parseHex(hex);
  return `rgb(${Math.floor(r * factor)},${Math.floor(g * factor)},${Math.floor(b * factor)})`;
}

export function lighten(hex: string, factor: number): string {
  const [r, g, b] = parseHex(hex);
  return `rgb(${Math.min(255, Math.floor(r + (255 - r) * factor))},${Math.min(
    255,
    Math.floor(g + (255 - g) * factor)
  )},${Math.min(255, Math.floor(b + (255 - b) * factor))})`;
}

export function polygonCenter(pts: Point2D[]): Point2D {
  let x = 0;
  let y = 0;
  for (const p of pts) {
    x += p.x;
    y += p.y;
  }
  return { x: x / pts.length, y: y / pts.length };
}

export const ZOOM_MIN = 0.3;
export const ZOOM_MAX = 3;

/**
 * 콘텐츠 이소메트릭 bbox를 뷰포트에 auto-fit 하는 camera 계산.
 * renderer.ts의 변환식과 정합:
 *   screen_x = width/2 + camera.x + iso_x*zoom  (dpr=1 기준)
 *   screen_y = height/2.5 + camera.y + iso_y*zoom
 * 콘텐츠 bbox 중심을 (width/2, height/2)에 위치시키려면:
 *   camera.x = -cx*zoom
 *   camera.y = -cy*zoom + height*(1/2 - 1/2.5) = -cy*zoom + height*0.1
 */
export function fitCameraToBounds(
  bbox: { minX: number; minY: number; maxX: number; maxY: number },
  width: number,
  height: number,
  padding = 80
): { x: number; y: number; zoom: number } {
  const w = Math.max(1, bbox.maxX - bbox.minX);
  const h = Math.max(1, bbox.maxY - bbox.minY);
  const scaleX = (width - padding * 2) / w;
  const scaleY = (height - padding * 2) / h;
  const zoom = Math.min(scaleX, scaleY, ZOOM_MAX);
  const cx = (bbox.minX + bbox.maxX) / 2;
  const cy = (bbox.minY + bbox.maxY) / 2;
  return {
    x: -cx * zoom,
    y: -cy * zoom + height * 0.1,
    zoom,
  };
}

export function polygonBounds(pts: Point2D[]) {
  let minX = Infinity,
    minY = Infinity,
    maxX = -Infinity,
    maxY = -Infinity;
  for (const p of pts) {
    if (p.x < minX) minX = p.x;
    if (p.y < minY) minY = p.y;
    if (p.x > maxX) maxX = p.x;
    if (p.y > maxY) maxY = p.y;
  }
  return { minX, minY, maxX, maxY };
}
