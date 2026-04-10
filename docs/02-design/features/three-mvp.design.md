---
feature: three-mvp
title: Three.js MVP 프로토타입 설계
phase: design
created: 2026-04-10
planDoc: ../01-plan/features/three-mvp.plan.md
---

# Three.js MVP Design Document

> **Summary**: Canvas 2D → Three.js 전환 테스트를 위한 독립 프로토타입 설계
>
> **Project**: three-mvp (isometrix 외부)
> **Date**: 2026-04-10
> **Planning Doc**: [three-mvp.plan.md](../01-plan/features/three-mvp.plan.md)

---

## 1. Architecture

### 1.1 Component Diagram

```
┌──────────────────────────────────────────────┐
│  App.tsx                                     │
│  ┌────────────┐  ┌─────────────────────────┐ │
│  │ DxfDropZone│  │ Scene.tsx (R3F Canvas)   │ │
│  │            │  │  ├── OrthographicCamera  │ │
│  │ DXF 파일   │──▶  ├── Lights (Ambient+Dir)│ │
│  │ 또는 샘플  │  │  ├── RoomMesh[] (바닥/벽)│ │
│  └────────────┘  │  ├── DoorMesh[]          │ │
│                  │  ├── WindowMesh[]         │ │
│  ┌────────────┐  │  └── OrbitControls       │ │
│  │ ColorPanel │  └─────────────────────────┘ │
│  │ (간단 UI)  │                              │
│  └────────────┘                              │
└──────────────────────────────────────────────┘
```

### 1.2 Data Flow

```
DXF File → parseDxf() → buildFloorPlan() → FloorPlan state
                                               ↓
                                          Scene.tsx
                                               ↓
                                     RoomMesh (Three.js geometry)
                                               ↓
                                     Raycaster click → color change
```

---

## 2. Data Model

기존 isometrix의 `types/room.ts` 그대로 사용:
- `FloorPlan { rooms, doors, windows, internalWalls? }`
- `Room { id, name, points, wallHeight, floor, wall, baseboard, ceiling, door }`
- `MaterialAssignment { materialId, color, patternType }`

추가 타입 없음 — MVP 범위.

---

## 3. Three.js 씬 설계 (`Scene.tsx`)

### 3.1 카메라
```typescript
// OrthographicCamera — 이소메트릭 느낌 유지
position: [10, 10, 10]  // 대각선 위에서 내려다보기
zoom: 50                 // 적절한 확대
```

### 3.2 조명
```typescript
<ambientLight intensity={0.6} />
<directionalLight
  position={[10, 15, 10]}
  intensity={0.8}
  castShadow
  shadow-mapSize={[2048, 2048]}
/>
```

### 3.3 좌표계
- Three.js 기본: X=우, Y=위, Z=앞
- FloorPlan의 (x, y) → Three.js (x, 0, y)로 매핑
- wallHeight → Y축 방향

---

## 4. RoomMesh 설계

### 4.1 바닥
```
room.points → THREE.Shape → ShapeGeometry
  → rotation.x = -Math.PI/2 (XZ 평면에 눕히기)
  → position.y = 0
  → MeshStandardMaterial({ color: room.floor.color })
```

### 4.2 벽
각 edge (i → i+1):
```
wallLength = distance(points[i], points[i+1])
wallHeight = room.wallHeight

PlaneGeometry(wallLength, wallHeight)
  → position: edge 중점, y = wallHeight/2
  → rotation: edge 방향에 맞춤 (atan2)
  → 법선이 방 안쪽을 향하도록
  → MeshStandardMaterial({ color: room.wall.color, side: DoubleSide })
```

### 4.3 걸레받이
```
각 edge 하단에 BoxGeometry(wallLength, 0.1, 0.02)
  → position.y = 0.05
  → MeshStandardMaterial({ color: room.baseboard.color })
```

### 4.4 천장 (선택)
바닥과 동일한 Shape, position.y = wallHeight

---

## 5. 인터랙션

### 5.1 클릭 선택
- R3F의 `onClick` 이벤트 (Raycaster 자동)
- 각 mesh에 `onClick` → 해당 mesh의 color를 state로 관리
- userData에 `{ roomId, part, wallIndex }` 저장

### 5.2 색상 변경 UI
```
간단한 div 버튼 6개 (프리셋 색상):
#d4c5a9 (베이지), #8B4513 (갈색), #ece6dc (크림),
#2F4F4F (다크그린), #4682B4 (스틸블루), #FFFFFF (화이트)
```

---

## 6. 컴포넌트 목록

| 컴포넌트 | 파일 | 역할 |
|----------|------|------|
| App | `src/App.tsx` | FloorPlan state 관리, 레이아웃 |
| Scene | `src/components/Scene.tsx` | R3F Canvas, 카메라, 조명 |
| RoomMesh | `src/components/RoomMesh.tsx` | 방 하나의 모든 mesh (바닥+벽+걸레받이) |
| DoorMesh | `src/components/DoorMesh.tsx` | 문 표현 (벽 개구부 or 별도 mesh) |
| WindowMesh | `src/components/WindowMesh.tsx` | 창문 표현 |
| DxfDropZone | `src/components/DxfDropZone.tsx` | DXF 파일 드래그앤드롭 |

---

## 7. 구현 순서

1. [ ] 프로젝트 초기화 + 의존성 (이미 완료)
2. [ ] types/room.ts + lib/dxf 파싱 복사
3. [ ] Scene.tsx — 빈 Canvas + 카메라 + 조명 + OrbitControls
4. [ ] RoomMesh.tsx — 바닥 + 벽 (하드코딩 샘플)
5. [ ] App.tsx — 샘플 데이터 연결 + 색상 변경 UI
6. [ ] DxfDropZone.tsx — DXF 파일 업로드
7. [ ] DoorMesh + WindowMesh (시간 여유 시)

---

## 8. 검증

| 항목 | 기준 |
|------|------|
| 렌더링 | 하드코딩 2개 방이 3D로 보임 |
| 카메라 | 자유 회전/줌/팬 동작 |
| 조명 | 벽 면별 밝기 차이 자동 |
| DXF | 파일 드롭 → 실제 도면 3D 변환 |
| 클릭 | 벽/바닥 클릭 → 색상 변경 |
