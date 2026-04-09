import type { FloorPlan, MaterialAssignment } from './room';

export interface CameraState {
  zoom: number;
  offsetX: number;
  offsetY: number;
  rotation?: number;
}

export interface MaterialsConfig {
  [roomId: string]: {
    floor?: MaterialAssignment;
    wall?: MaterialAssignment;
    baseboard?: MaterialAssignment;
    ceiling?: MaterialAssignment;
  };
}

export interface Project {
  id: string;
  userId: string;
  name: string;
  dxfFileUrl?: string;
  roomsData: FloorPlan;
  materialsConfig: MaterialsConfig;
  cameraState: CameraState;
  thumbnailUrl?: string;
  createdAt: string;
  updatedAt: string;
}
