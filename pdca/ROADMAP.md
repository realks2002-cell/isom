# 인테리어 마감재 시뮬레이터 — 로드맵

## 1. 프로젝트 개요
- **제품**: CAD 평면도(.dxf) → 이소메트릭 3D 뷰 → 마감재(바닥/벽/걸레받이/천장) 시뮬레이션 SaaS
- **타겟**: 인테리어 업체/건축사. 모바일 우선, 현장에서 고객 앞에서 사용
- **핵심 가치**: 영역 탭 → 자재 탭, **2탭 안에 마감재 변경 완료**
- **출력**: PNG 내보내기(1920×1080) + Nano Banana AI 포토리얼 렌더링 + 카톡/이메일 공유

## 2. 기술 스택
- Next.js 14 (App Router) + TypeScript + Tailwind
- Canvas 2D (❌ Three.js/WebGL/Babylon)
- Supabase (Auth, Postgres, Storage, RLS)
- dxf-parser, @google/genai (Nano Banana)
- Vercel + PWA → 이후 Capacitor 하이브리드

## 3. 디렉터리 구조
CLAUDE.md의 `src/` 트리를 그대로 채택:
- `app/` — layout, page, dashboard, editor/[projectId], admin/(materials|categories), api/ai-render
- `components/canvas/` — IsometricRenderer, FloorRenderer, WallRenderer, BaseboardRenderer, CameraController
- `components/ui/` — MaterialPanel, MaterialCard, CategoryTabs, PartSelector, Toolbar, ExportButton
- `components/dxf/` — DxfUploader, DxfParser, LayerMapper
- `components/ai/` — AiRenderButton, RenderStyleSelector, RenderQualityToggle, RenderPreview, RenderCompare, RenderHistory
- `lib/` — isometric, patterns, materials, dxf-to-rooms, hit-detection, export, ai-render, ai-render-prompts, supabase
- `types/` — room, material, project
- `hooks/` — useCanvas, useCamera, useTouchGesture, useMaterials, useProject, useAiRender

---

## 4. Phase별 로드맵

### Phase 1 — 세팅 & 인증 (1주차)
- Next.js + TS + Tailwind 초기화
- Supabase 프로젝트 생성, 테이블 마이그레이션: `profiles`, `projects`, `material_categories`, `materials`
- RLS 정책: projects는 본인만, materials는 인증 유저 읽기 / admin만 쓰기
- Supabase Auth 이메일 로그인
- 대시보드 프로젝트 목록 CRUD, 기본 레이아웃(헤더/사이드바)
- **검증**: 로그인 → 프로젝트 생성/삭제, 타 유저 RLS 격리

### Phase 2 — DXF 파싱 엔진 (2주차)
- `components/dxf/DxfUploader` + `DxfParser.ts`(dxf-parser 래퍼)
- `lib/dxf-to-rooms.ts`: LINE/POLYLINE/LWPOLYLINE → 벽 좌표, 닫힌 영역 자동 감지 → Room[]
- 레이어 자동 매핑(WALL/벽/DOOR/문/WINDOW/창/A-WALL…) + `LayerMapper` 수동 매핑 UI
- 단위(mm/cm/m) 감지 정규화, 원점 중앙 정렬, ARC(곡선 벽) 무시
- `projects.rooms_data` JSONB 저장
- **검증**: 샘플 DXF 3종(mm/cm/m)에서 Room[]·Door[]·Window[] 생성

### Phase 3 — 이소메트릭 렌더러 (3주차)
- `lib/isometric.ts`: `SCALE=38`, `toIso(x,y,z)`, `screenToGrid`
- `IsometricRenderer` + `FloorRenderer` / `WallRenderer` / `BaseboardRenderer` / `CameraController`
- Z-order: 방을 (x+y) 작은 순 정렬 (페인터 알고리즘)
- 면별 밝기: 뒤/윗면 1.0, 오른쪽 ×0.92, 왼쪽 ×0.82
- 벽 상단 캡(두께), 문 개구부(어두운 사각형), 창문(반투명 파랑 + 십자 프레임)
- 바닥 패턴 9종: tile, wood, herringbone, marble, solid, brick, subway, terrazzo, concrete
- `hooks/useCanvas`, `useCamera`, `useTouchGesture` — 1-finger drag 패닝, 2-finger pinch 줌(0.3~3x), tap 선택, 더블탭 리셋, wheel 줌
- `lib/hit-detection.ts` — 영역 탭 감지
- **검증**: `prototype/isometric-prototype.html`과 시각 일치 + 모바일 60fps

### Phase 4 — 마감재 시스템 (4주차)
- 기본 프리셋 30~50종 시딩
- `MaterialPanel`(데스크톱 260px 사이드 / 모바일 50% 바텀시트)
- `PartSelector`(바닥/벽/걸레받이/천장) → `CategoryTabs` → `MaterialCard` 그리드
- 자재 선택 → 즉시 이소메트릭 뷰 반영
- **텍스처 LOD**:
  - 줌 < 0.7: 색상 + 패턴 힌트(줄눈만)
  - 0.7~1.5: thumb 텍스처 / 패턴 렌더링
  - > 1.5: medium/원본 텍스처
- Canvas `setTransform()` + `createPattern()`으로 이소메트릭 각도 매핑
- 관리자(`/admin/materials`, `/admin/categories`): 등록/수정/삭제, Storage 업로드, thumb/medium 자동 리사이즈
- **검증**: 2탭 내 변경, 9개 패턴 시각 확인, LOD 전환 자연스러움

### Phase 5 — 마무리 & 배포 (5주차)
- `lib/export.ts` PNG 1920×1080(흰 배경, 자동 프레이밍)
- Web Share API 공유 + download 폴백
- 프로젝트 저장/불러오기(카메라 상태 포함), updated_at 갱신, 썸네일 저장
- PWA manifest + service worker
- 반응형 최적화(모바일/데스크톱)
- **Vercel 배포(사용자 승인 후)** + 실기기 QA

### Phase 6 — AI 포토리얼 렌더링 / Nano Banana (6주차)
- 환경변수: `GOOGLE_AI_API_KEY`, `AI_RENDER_MODEL_FAST=gemini-3.1-flash-image-preview`, `AI_RENDER_MODEL_HIGH=gemini-3-pro-image-preview`, `AI_RENDER_MONTHLY_LIMIT`
- `app/api/ai-render/route.ts`: 인증 검증 → Canvas PNG base64 수신 → Nano Banana 호출 → Storage `renders/{userId}/{ts}.png` 저장 → publicUrl 반환
- `lib/ai-render.ts`: Flash/Pro 분기, 마감재 정보 자연어 빌드
- `lib/ai-render-prompts.ts`: 스타일 5종(modern/classic/minimal/luxury/scandinavian)
- `components/ai/*`: 플로팅 버튼, 스타일/품질 선택, Preview 전체화면, 원본 vs AI 슬라이더 비교, History
- `hooks/useAiRender`: 요청/로딩/에러 상태
- 월간 한도 체크, "1회 차감" 확인 다이얼로그, 친절한 에러 메시지
- **검증**: 이소메트릭 캡처 → AI 변환(5~15초) → 비교 뷰 → PNG 저장/공유 end-to-end

### Phase 7+ — Capacitor 네이티브 고도화 (향후)
- `next.config.js`: `output: 'export'`, `images.unoptimized: true`
- **API Routes는 static export에서 안 됨** → 별도 Vercel 서버로 분리, `lib/api-client.ts`의 `API_BASE` 스위칭 (웹: 상대경로, 네이티브: 절대 URL)
- `@capacitor/camera`(현장 촬영), `@capacitor/filesystem`(오프라인 캐시)
- iOS/Android 빌드 → App Store / Google Play
- ⚠️ **웹 작업 중 `/ios`, `/android`, `capacitor.config.ts` 절대 수정 금지**

---

## 5. 코딩 규칙
- TypeScript strict
- 함수형 컴포넌트 + hooks
- 상태관리: React state + Context (필요 시 Zustand). Redux 금지
- Canvas 로직은 `lib/`에 순수 함수로 분리 → 컴포넌트에서 호출
- Supabase 쿼리는 `hooks/` 커스텀 훅으로 래핑
- try/catch + toast, 한국어 UI, 모바일 퍼스트

## 6. 금지 사항
- Three.js / WebGL / Babylon.js
- 정밀 치수 계산, 가구/소품 배치, 복잡 조명/그림자 시뮬
- Redux 등 무거운 상태관리
- 에디터 페이지에 불필요한 서버 컴포넌트

## 7. QA 체크리스트
- [ ] DXF 3종(mm/cm/m) 파싱 성공
- [ ] Phase 3 렌더링이 프로토타입과 시각 일치
- [ ] 영역 탭 → 자재 탭 2탭 내 완료
- [ ] 모바일 60fps 유지(핀치/팬)
- [ ] 텍스처 LOD 3단계 전환 확인
- [ ] PNG 내보내기 1920×1080, Web Share API 동작
- [ ] RLS: 타 유저 projects/renders 접근 차단
- [ ] AI 렌더링 end-to-end + 월간 한도
- [ ] PWA 설치 + 오프라인 기본 화면
- [ ] Vercel 배포는 **사용자 승인 후에만**

## 8. 참고
- `CLAUDE.md` — 전체 스펙 원본
- `prototype/isometric-prototype.html` — 검증된 Canvas 2D 프로토타입(Phase 3 기준)
