---
feature: three-mvp
title: Three.js MVP 프로토타입 (별도 폴더)
phase: plan
created: 2026-04-10
---

# Three.js MVP 프로토타입

## 목적
Canvas 2D 이소메트릭 렌더러의 한계(수동 Z-order, 벽 모서리 접합, 조명/그림자 없음)를 Three.js로 대체하면 어떤 품질이 나오는지 **별도 폴더에서 빠르게 테스트**한다. 기존 isometrix 프로젝트는 건드리지 않는다.

## 배경
- 현재 Canvas 2D: 벽 모서리 miter 수동 계산, 조명 없음, hit detection 수학 복잡
- Three.js: 조명/그림자 자동, Raycaster hit detection, OrbitControls 내장
- 동일한 DXF → FloorPlan 데이터를 Three.js로 렌더링하여 품질/성능 비교

## 범위

### In Scope
- [ ] Vite + React + Three.js 프로젝트 초기화 (`/Users/kenny/Desktop/Task/three-mvp/`)
- [ ] 기존 타입/DXF 파싱 로직 복사 (room.ts, dxf-to-rooms.ts, dxf/parser.ts)
- [ ] Three.js 3D 씬: 바닥, 벽, 걸레받이, 천장 mesh
- [ ] OrbitControls 카메라 (자유 회전/줌/팬)
- [ ] 조명: AmbientLight + DirectionalLight (그림자)
- [ ] DXF 파일 드래그앤드롭 업로드
- [ ] 하드코딩 샘플 데이터 (DXF 없이 즉시 테스트)
- [ ] 벽/바닥 클릭 → 색상 변경 (Raycaster)

### Out of Scope
- Supabase 연동, 인증, 프로젝트 저장
- 텍스처/패턴 렌더링 (색상만)
- MaterialPanel UI (간단한 컬러 버튼만)
- 모바일 최적화 (데스크톱에서 먼저 테스트)
- AI 렌더링

## 기술 스택

| 결정 | 선택 | 이유 |
|------|------|------|
| 빌드 | Vite | 서버 불필요, 빠른 HMR |
| UI | React + TypeScript | 기존 스택과 동일 |
| 3D | Three.js + @react-three/fiber + @react-three/drei | React 바인딩, OrbitControls 내장 |
| DXF | dxf-parser | 기존과 동일 |

## 프로젝트 구조

```
three-mvp/
├── src/
│   ├── main.tsx
│   ├── App.tsx                   # DXF 업로드 or 샘플 → 뷰어
│   ├── types/room.ts             # isometrix에서 복사
│   ├── lib/
│   │   ├── dxf-parser-wrapper.ts # parseDxf()
│   │   └── dxf-to-rooms.ts      # buildFloorPlan()
│   └── components/
│       ├── Scene.tsx             # R3F Canvas + 카메라 + 조명
│       ├── RoomMesh.tsx          # Room → 바닥/벽/baseboard mesh
│       ├── DoorMesh.tsx          # 문 개구부
│       ├── WindowMesh.tsx        # 창문 mesh
│       └── DxfDropZone.tsx       # DXF 드래그앤드롭
```

## 구현 단계

### Step 1: 프로젝트 초기화 + 의존성 설치
### Step 2: 타입 + DXF 파싱 로직 복사 (import 경로만 수정)
### Step 3: Three.js 씬 — OrthographicCamera, 조명, OrbitControls
### Step 4: RoomMesh — Shape으로 바닥, Plane으로 벽, Box로 걸레받이
### Step 5: DXF 드롭존 + 하드코딩 샘플 데이터
### Step 6: Raycaster 클릭 → 색상 변경

## 복사 대상 파일

| 원본 (isometrix) | 대상 (three-mvp) | 수정 |
|-------------------|-------------------|------|
| `src/types/room.ts` | `src/types/room.ts` | 그대로 |
| `src/lib/dxf/parser.ts` | `src/lib/dxf-parser-wrapper.ts` | import 경로 |
| `src/lib/dxf-to-rooms.ts` | `src/lib/dxf-to-rooms.ts` | import 경로 |

## 리스크

| 리스크 | 영향 | 대응 |
|--------|------|------|
| 모바일 WebGL 성능 | High | 데스크톱 먼저, 모바일은 나중에 |
| Three.js 번들 크기 (~150KB) | Medium | tree-shaking으로 최소화 |
| DXF 비정형 폴리곤 → 3D mesh 변환 실패 | Medium | 하드코딩 데이터로 우회 |

## 검증
1. `npm run dev` → 하드코딩 2개 방이 3D로 보이는지
2. 마우스 드래그 회전/줌 자유 시점
3. DXF 파일 드롭 → 실제 도면 3D 변환
4. 벽 클릭 → 색상 변경
5. Canvas 2D 대비 렌더링 품질 비교
