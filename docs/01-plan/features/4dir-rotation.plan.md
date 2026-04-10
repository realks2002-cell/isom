---
feature: 4dir-rotation
title: 4방향 프리셋 회전 (0°/90°/180°/270°)
phase: plan
created: 2026-04-10
---

# 4방향 프리셋 회전

## 목적
고객 상담 시 이소메트릭 뷰를 90° 단위로 회전하여 모든 벽면을 확인할 수 있게 한다. Three.js 없이 Canvas 2D 기반으로 구현.

## 핵심 원리
`toIso(x, y)` 진입 전에 평면 좌표를 90° 단위로 변환:
- 0°: (x, y) / 90°: (-y, x) / 180°: (-x, -y) / 270°: (y, -x)

## 구현 단계

### Step 1: isometric.ts — rotatePoint 함수
- `rotatePoint(x, y, rotation)` export
- `screenToIso` 에 역회전 추가

### Step 2: renderer.ts — 회전 좌표 적용
- RenderState 에 rotation 추가
- render() 내부에 `iso()` 래퍼로 전체 toIso 교체
- drawWall, drawWallTopCaps 등 헬퍼에도 전달

### Step 3: IsometricCanvas.tsx — 회전 버튼 UI
- Camera 타입에 rotation 추가
- 줌 버튼 옆에 ↻ ↺ 버튼
- 회전 시 auto-fit 재실행
- hitTest 에 역회전 적용

### Step 4: EditorCanvas.tsx — 카메라 저장
- CameraState.rotation (이미 존재) 활용
- 저장/로드 시 rotation 유지

### Step 5: 검증
- 4방향 렌더링 + hit-test + 자재 적용 + 상태 저장

## 수정 파일
- `src/lib/isometric.ts`
- `src/lib/renderer.ts`
- `src/components/canvas/IsometricCanvas.tsx`
- `src/components/editor/EditorCanvas.tsx`

## 범위 밖
- 자유 각도 회전, 애니메이션, Three.js
