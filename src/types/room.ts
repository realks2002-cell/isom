export interface Point2D {
  x: number;
  y: number;
}

export type PatternType =
  | 'tile'
  | 'wood'
  | 'herringbone'
  | 'marble'
  | 'solid'
  | 'brick'
  | 'subway'
  | 'terrazzo'
  | 'concrete';

export type PartType = 'floor' | 'wall' | 'baseboard' | 'ceiling' | 'door';

export interface MaterialAssignment {
  materialId: string;
  color: string;
  patternType: PatternType;
  textureUrl?: string;
  tileSize?: number;
}

export interface Room {
  id: string;
  name: string;
  points: Point2D[];
  wallHeight: number;
  floor: MaterialAssignment;
  wall: MaterialAssignment;
  walls?: Record<number, MaterialAssignment>;
  baseboard: MaterialAssignment;
  ceiling: MaterialAssignment;
  door: MaterialAssignment;
}

export interface Door {
  id: string;
  position: Point2D;
  direction: 'h' | 'v';
  width: number;
  connectsRooms: [string, string];
}

export interface Window {
  id: string;
  position: Point2D;
  direction: 'h' | 'v';
  width: number;
  roomId: string;
}

export type PartitionColor = 'black' | 'darkgray' | 'white';

export interface WallSegment {
  a: Point2D;
  b: Point2D;
  height?: number;
  partition?: boolean;
  partitionColor?: PartitionColor;
}

export interface FloorPlan {
  rooms: Room[];
  doors: Door[];
  windows: Window[];
  /** 외곽에 포함되지 않은 내부 벽 세그먼트 */
  internalWalls?: WallSegment[];
  buildingType?: string;
  partitionColor?: PartitionColor;
}
