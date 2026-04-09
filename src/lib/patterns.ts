import type { Point2D, PatternType, MaterialAssignment } from '@/types/room';
import { SCALE, toIso, polygonBounds } from './isometric';

function seededRand(seed: number) {
  let h = seed || 1;
  return () => {
    h = (h * 16807) % 2147483647;
    return h / 2147483647;
  };
}

function tileSizeGrid(mat: MaterialAssignment, fallback = 30): number {
  return (mat.tileSize ?? fallback) / SCALE;
}

export function drawFloorPattern(
  ctx: CanvasRenderingContext2D,
  points: Point2D[],
  mat: MaterialAssignment
) {
  ctx.save();
  const iso = points.map((p) => toIso(p.x, p.y));
  ctx.beginPath();
  iso.forEach((p, i) => (i === 0 ? ctx.moveTo(p.x, p.y) : ctx.lineTo(p.x, p.y)));
  ctx.closePath();
  ctx.clip();

  ctx.fillStyle = mat.color;
  ctx.fill();

  switch (mat.patternType) {
    case 'tile':
    case 'subway':
    case 'brick':
      drawTile(ctx, points, mat);
      break;
    case 'wood':
      drawWood(ctx, points, mat);
      break;
    case 'herringbone':
      drawHerringbone(ctx, points, mat);
      break;
    case 'terrazzo':
      drawTerrazzo(ctx, points);
      break;
    case 'concrete':
      drawConcrete(ctx, points);
      break;
    case 'marble':
      drawMarble(ctx, points);
      break;
    case 'solid':
    default:
      break;
  }

  ctx.restore();

  // 바닥 윤곽선
  ctx.beginPath();
  iso.forEach((p, i) => (i === 0 ? ctx.moveTo(p.x, p.y) : ctx.lineTo(p.x, p.y)));
  ctx.closePath();
  ctx.strokeStyle = 'rgba(0,0,0,0.15)';
  ctx.lineWidth = 0.5;
  ctx.stroke();
}

function drawTile(
  ctx: CanvasRenderingContext2D,
  points: Point2D[],
  mat: MaterialAssignment
) {
  const { minX, minY, maxX, maxY } = polygonBounds(points);
  const ts = tileSizeGrid(mat, 30);
  ctx.strokeStyle = 'rgba(0,0,0,0.1)';
  ctx.lineWidth = 0.5;

  for (let gx = minX; gx <= maxX; gx += ts) {
    const p1 = toIso(gx, minY);
    const p2 = toIso(gx, maxY);
    ctx.beginPath();
    ctx.moveTo(p1.x, p1.y);
    ctx.lineTo(p2.x, p2.y);
    ctx.stroke();
  }
  for (let gy = minY; gy <= maxY; gy += ts) {
    const p1 = toIso(minX, gy);
    const p2 = toIso(maxX, gy);
    ctx.beginPath();
    ctx.moveTo(p1.x, p1.y);
    ctx.lineTo(p2.x, p2.y);
    ctx.stroke();
  }
}

function drawWood(
  ctx: CanvasRenderingContext2D,
  points: Point2D[],
  mat: MaterialAssignment
) {
  const { minX, minY, maxX, maxY } = polygonBounds(points);
  const ts = tileSizeGrid(mat, 40);

  ctx.strokeStyle = 'rgba(0,0,0,0.06)';
  ctx.lineWidth = 0.3;
  for (let gy = minY; gy <= maxY; gy += ts * 0.15) {
    const p1 = toIso(minX, gy);
    const p2 = toIso(maxX, gy);
    ctx.beginPath();
    ctx.moveTo(p1.x, p1.y);
    ctx.lineTo(p2.x, p2.y);
    ctx.stroke();
  }
  ctx.strokeStyle = 'rgba(0,0,0,0.12)';
  ctx.lineWidth = 0.5;
  for (let gx = minX; gx <= maxX; gx += ts * 0.5) {
    const p1 = toIso(gx, minY);
    const p2 = toIso(gx, maxY);
    ctx.beginPath();
    ctx.moveTo(p1.x, p1.y);
    ctx.lineTo(p2.x, p2.y);
    ctx.stroke();
  }
}

function drawHerringbone(
  ctx: CanvasRenderingContext2D,
  points: Point2D[],
  mat: MaterialAssignment
) {
  const { minX, minY, maxX, maxY } = polygonBounds(points);
  const ts = tileSizeGrid(mat, 20);

  ctx.strokeStyle = 'rgba(0,0,0,0.12)';
  ctx.lineWidth = 0.4;
  for (let gx = minX; gx <= maxX; gx += ts) {
    for (let gy = minY; gy <= maxY; gy += ts) {
      const alt = Math.floor((gx - minX) / ts + (gy - minY) / ts) % 2;
      const p1 = toIso(gx, gy);
      const p2 = alt ? toIso(gx + ts, gy + ts * 0.5) : toIso(gx + ts * 0.5, gy + ts);
      ctx.beginPath();
      ctx.moveTo(p1.x, p1.y);
      ctx.lineTo(p2.x, p2.y);
      ctx.stroke();
    }
  }
}

function drawTerrazzo(ctx: CanvasRenderingContext2D, points: Point2D[]) {
  const { minX, minY, maxX, maxY } = polygonBounds(points);
  const rand = seededRand(42);
  for (let i = 0; i < 80; i++) {
    const gx = minX + rand() * (maxX - minX);
    const gy = minY + rand() * (maxY - minY);
    const p = toIso(gx, gy);
    const r = 1 + rand() * 2;
    ctx.beginPath();
    ctx.arc(p.x, p.y, r, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(${80 + rand() * 80},${70 + rand() * 70},${60 + rand() * 60},0.18)`;
    ctx.fill();
  }
}

function drawConcrete(ctx: CanvasRenderingContext2D, points: Point2D[]) {
  const { minX, minY, maxX, maxY } = polygonBounds(points);
  const rand = seededRand(99);
  ctx.strokeStyle = 'rgba(0,0,0,0.06)';
  ctx.lineWidth = 0.3;
  for (let i = 0; i < 25; i++) {
    const gx = minX + rand() * (maxX - minX);
    const gy = minY + rand() * (maxY - minY);
    const p1 = toIso(gx, gy);
    const p2 = toIso(gx + (rand() - 0.5) * 2, gy + (rand() - 0.5) * 2);
    ctx.beginPath();
    ctx.moveTo(p1.x, p1.y);
    ctx.lineTo(p2.x, p2.y);
    ctx.stroke();
  }
}

function drawMarble(ctx: CanvasRenderingContext2D, points: Point2D[]) {
  const { minX, minY, maxX, maxY } = polygonBounds(points);
  const rand = seededRand(7);
  ctx.strokeStyle = 'rgba(0,0,0,0.08)';
  ctx.lineWidth = 0.6;
  for (let i = 0; i < 14; i++) {
    ctx.beginPath();
    const x0 = minX + rand() * (maxX - minX);
    const y0 = minY + rand() * (maxY - minY);
    const p0 = toIso(x0, y0);
    ctx.moveTo(p0.x, p0.y);
    for (let s = 0; s < 4; s++) {
      const p = toIso(
        x0 + (rand() - 0.5) * 1.2,
        y0 + (rand() - 0.5) * 1.2
      );
      ctx.lineTo(p.x, p.y);
    }
    ctx.stroke();
  }
}

export const PATTERN_LIST: PatternType[] = [
  'tile',
  'wood',
  'herringbone',
  'marble',
  'solid',
  'brick',
  'subway',
  'terrazzo',
  'concrete',
];
