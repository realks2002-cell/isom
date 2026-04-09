import DxfParser from 'dxf-parser';

export type ArchPart = 'wall' | 'door' | 'window' | 'ignore';

export interface LayerInfo {
  name: string;
  entityCount: number;
  autoMapped: ArchPart;
}

export interface ParsedDxf {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  raw: any;
  layers: LayerInfo[];
  unit: DxfUnit;
}

// DXF header $INSUNITS 코드: 0=unitless, 1=inch, 2=feet, 4=mm, 5=cm, 6=m
// 내부 표현은 mm/cm/m만 쓰므로 imperial은 mm로 변환 가능한 가상 단위로 매핑
export type DxfUnit = 'mm' | 'cm' | 'm' | 'inch' | 'feet';

function detectUnit(insunits?: number): DxfUnit {
  switch (insunits) {
    case 1:
      return 'inch';
    case 2:
      return 'feet';
    case 4:
      return 'mm';
    case 5:
      return 'cm';
    case 6:
      return 'm';
    default:
      return 'mm'; // 0(unitless) or unknown
  }
}

const WALL_PATTERNS = [/wall/i, /벽/, /^a-?wall/i];
const DOOR_PATTERNS = [/door/i, /문/, /^a-?door/i];
const WINDOW_PATTERNS = [/window/i, /창/, /^a-?wind/i];

function autoMapLayer(name: string): ArchPart {
  if (WALL_PATTERNS.some((r) => r.test(name))) return 'wall';
  if (DOOR_PATTERNS.some((r) => r.test(name))) return 'door';
  if (WINDOW_PATTERNS.some((r) => r.test(name))) return 'window';
  return 'ignore';
}

export function parseDxf(text: string): ParsedDxf {
  const parser = new DxfParser();
  const raw = parser.parseSync(text);
  if (!raw) throw new Error('DXF 파싱 실패');

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const entities: any[] = raw.entities ?? [];
  const counts = new Map<string, number>();
  for (const e of entities) {
    const name = e.layer ?? '0';
    counts.set(name, (counts.get(name) ?? 0) + 1);
  }

  const layers: LayerInfo[] = Array.from(counts.entries())
    .map(([name, entityCount]) => ({
      name,
      entityCount,
      autoMapped: autoMapLayer(name),
    }))
    .sort((a, b) => b.entityCount - a.entityCount);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const insunits = (raw.header as any)?.$INSUNITS;
  const unit = detectUnit(insunits);

  return { raw, layers, unit };
}
