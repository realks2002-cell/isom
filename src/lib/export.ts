import type { FloorPlan } from '@/types/room';
import { render } from './renderer';
import { toIso, fitCameraToBounds } from './isometric';

const EXPORT_W = 1920;
const EXPORT_H = 1080;
const PADDING = 80;

function computeIsoBounds(floorPlan: FloorPlan) {
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
  return { minX, minY, maxX, maxY };
}

export async function captureFloorPlanBase64(floorPlan: FloorPlan): Promise<string> {
  const canvas = document.createElement('canvas');
  canvas.width = EXPORT_W;
  canvas.height = EXPORT_H;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas context not available');
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, EXPORT_W, EXPORT_H);
  const bbox = computeIsoBounds(floorPlan);
  const camera = isFinite(bbox.minX)
    ? fitCameraToBounds(bbox, EXPORT_W, EXPORT_H, PADDING)
    : { x: 0, y: 0, zoom: 1 };
  render(ctx, {
    floorPlan,
    camera,
    selection: null,
    width: EXPORT_W,
    height: EXPORT_H,
    dpr: 1,
  });
  return canvas.toDataURL('image/png').split(',')[1];
}

export async function exportFloorPlanPng(floorPlan: FloorPlan): Promise<Blob> {
  const canvas = document.createElement('canvas');
  canvas.width = EXPORT_W;
  canvas.height = EXPORT_H;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas context not available');

  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, EXPORT_W, EXPORT_H);

  const bbox = computeIsoBounds(floorPlan);
  const camera = isFinite(bbox.minX)
    ? fitCameraToBounds(bbox, EXPORT_W, EXPORT_H, PADDING)
    : { x: 0, y: 0, zoom: 1 };

  render(ctx, {
    floorPlan,
    camera,
    selection: null,
    width: EXPORT_W,
    height: EXPORT_H,
    dpr: 1,
  });

  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error('toBlob 실패'))),
      'image/png'
    );
  });
}

export function sanitizeFilename(name: string): string {
  return (
    name
      .replace(/[^\p{L}\p{N}_-]+/gu, '_')
      .replace(/_+/g, '_')
      .replace(/^_|_$/g, '') || 'floorplan'
  );
}

const IS_IOS =
  typeof navigator !== 'undefined' && /iPad|iPhone|iPod/.test(navigator.userAgent);

export type ShareResult = 'shared' | 'downloaded' | 'canceled';

async function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const result = reader.result as string;
      resolve(result.split(',')[1]);
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

async function shareNative(
  blob: Blob,
  filename: string,
  title: string
): Promise<ShareResult> {
  const { Filesystem, Directory } = await import('@capacitor/filesystem');
  const { Share } = await import('@capacitor/share');
  const data = await blobToBase64(blob);
  const saved = await Filesystem.writeFile({
    path: filename,
    data,
    directory: Directory.Cache,
  });
  try {
    await Share.share({ title, url: saved.uri, dialogTitle: title });
    return 'shared';
  } catch (e) {
    if ((e as Error)?.message?.includes('cancel')) return 'canceled';
    return 'downloaded';
  }
}

export async function sharePng(
  blob: Blob,
  filename: string,
  title: string
): Promise<ShareResult> {
  const { isNative } = await import('./platform');
  if (isNative()) {
    return shareNative(blob, filename, title);
  }

  const file = new File([blob], filename, { type: 'image/png' });

  if (
    typeof navigator !== 'undefined' &&
    typeof navigator.share === 'function' &&
    navigator.canShare?.({ files: [file] })
  ) {
    try {
      await navigator.share({ files: [file], title });
      return 'shared';
    } catch (e) {
      if ((e as Error)?.name === 'AbortError') return 'canceled';
      // 기타 에러 → 폴백으로 진행
    }
  }

  const url = URL.createObjectURL(blob);
  if (IS_IOS) {
    // iOS Safari는 <a download>를 무시 → 새 탭으로 이미지 열어 길게 눌러 저장
    window.open(url, '_blank');
  } else {
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
  }
  setTimeout(() => URL.revokeObjectURL(url), 60_000);
  return 'downloaded';
}
