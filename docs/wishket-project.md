# ISOPLAN 3D — 인테리어 시뮬레이션 SaaS

## 프로젝트 개요

DXF/DWG 평면도를 업로드하면 자동으로 **이소메트릭 3D 뷰**로 변환하고, 각 공간의 마감재(바닥, 벽, 걸레받이, 도어)를 실시간으로 시뮬레이션한 뒤, **AI로 포토리얼 렌더링 이미지**를 생성하는 SaaS 서비스입니다.

인테리어 업체, 건축사, 시공사가 고객 앞에서 현장에서 즉시 시뮬레이션을 보여줄 수 있도록 설계되었습니다.

- **라이브 서비스**: https://isom-neon.vercel.app
- **타겟**: 인테리어 업체, 건축사, 시공사, 리모델링 기업
- **핵심 차별점**:
  - CAD 파일 업로드 → 3D 자동 변환 (별도 3D 소프트웨어 불필요)
  - AI 기반 포토리얼 렌더링 (Google Gemini / Nano Banana)
  - 모바일 최적화 (현장에서 스마트폰으로 즉시 사용)

---

## 기술 스택

| 영역 | 스택 |
|------|------|
| 프론트엔드 | Next.js 16 (App Router), TypeScript, React 19 |
| 렌더링 | Canvas 2D (자체 이소메트릭 엔진) |
| 스타일링 | Tailwind CSS 4 |
| 백엔드/DB | Supabase (PostgreSQL, Auth, Storage, RLS) |
| AI | Google Gemini API (`@google/genai`) — 이미지 생성/분석 |
| 이미지 처리 | sharp (서버사이드 워터마크) |
| DXF 파싱 | dxf-parser |
| 배포 | Vercel |
| 모바일 | Capacitor (iOS/Android 하이브리드 앱) |

---

## 주요 기능 (구현 완료)

### 1. CAD 파일 업로드 & 파싱
- DXF/DWG 지원 (DWG는 변환 가이드 안내)
- 레이어 자동 감지 (벽, 문, 창, 칸막이)
- 레이어 매핑 UI (사용자가 수동 지정 가능)
- 단위 자동 감지 (mm, cm, m)

### 2. 이소메트릭 3D 뷰
- Canvas 2D 기반 자체 렌더링 엔진
- 방, 벽, 문, 창문, 걸레받이 자동 렌더링
- 4방향 회전 (90° 단위)
- 줌/팬/핀치 제스처 지원
- 벽 높이 조절

### 3. 마감재 시뮬레이션
- 5개 부위: 바닥, 벽, 걸레받이, 도어, 칸막이
- 9가지 패턴: 타일, 마루, 헤링본, 대리석, 솔리드, 벽돌, 서브웨이, 테라조, 콘크리트
- 개별 벽 선택 (1클릭 = 방 전체, 2클릭 = 개별 벽면)
- 전체 방 일괄 적용

### 4. 건물 유형별 설정
- 아파트 / 사무실 / 병원 / 상가·카페 / 학교·학원
- 유형별 방 이름 프리셋 (한국어/영어)
- 유형별 기본 마감재 자동 적용
- 유형별 AI 렌더링 프롬프트 최적화

### 5. AI 포토리얼 렌더링
- Google Gemini (Nano Banana) 기반
- 돌하우스 뷰 (천장 제거, 벽 두께 표현)
- 스타일 선택: 모던, 클래식, 미니멀, 럭셔리, 스칸디, 클리니컬, 코지
- 가구 배치: 없음/간단/완전
- 조명 옵션: 무드 조명 / 실용 조명
- **수정 지시 입력** — "벽을 더 밝게" 같은 자연어로 재렌더링
- **컨셉/현장 이미지 분석** — 사진 업로드 → AI가 마감재 자동 인식 및 적용

### 6. Quick Render
- CAD 파일 없이 이미지만으로 AI 렌더링
- 평면도 사진, CAD 스크린샷, 손 스케치 모두 가능

### 7. 공유 & 저장
- 렌더링 결과 공유 링크 (비로그인 접근)
- PNG 다운로드
- 렌더링 히스토리 (프로젝트별)
- 썸네일 자동 생성

### 8. 프로젝트 관리
- 프로젝트 CRUD
- 폴더 분류
- 자동 저장 (debounce)
- Undo/Redo (Ctrl+Z, 30단계)

### 9. 관리자 페이지
- 유저 관리 (조회, 편집, 삭제, 비밀번호 확인)
- 포트폴리오 관리 (드래그앤드롭 순서 변경)
- 자재 카탈로그 관리 (카테고리, 자재 CRUD + 이미지 업로드)
- **요금제 관리** (가격, 렌더링 횟수, 기능 목록 편집)
- **렌더링 사용량 현황** (구매/사용/잔여 횟수)

### 10. 요금제 (횟수 충전 방식)
- Standard: 10회 / ₩10,000
- Pro: 35회 / ₩30,000 (Most Popular)
- Max: 65회 / ₩50,000
- 관리자가 자유롭게 가격/횟수/기능 변경 가능

### 11. 온보딩
- 첫 로그인 시 샘플 아파트 프로젝트 자동 생성
- 4단계 가이드 카드 (업로드 → 마감재 → AI 렌더링 → 공유)

### 12. 모바일 네이티브 기능 (Capacitor)
- 카메라로 현장 사진 촬영
- Share API (PNG 공유)
- Haptics (햅틱 피드백)
- iOS/Android 앱 빌드 구성 완료

---

## 추가 개발 필요 사항

### Phase A: 결제 연동 (필수)
- **토스페이먼츠 연동** (한국 시장)
- 렌더링 횟수 패키지 구매
- 결제 내역 / 영수증
- 환불 처리
- 예상 규모: 2주

### Phase B: 마감재 명세서 PDF
- 프로젝트별 자재 명세서 자동 생성
- 방별 자재 목록 + 수량 + 예상 비용
- 브랜드 로고 삽입 (Business 플랜)
- 예상 규모: 1주

### Phase C: DXF 파싱 개선
- 벽 두께 폴리곤 → 방 영역 자동 생성 알고리즘
- 다양한 CAD 소프트웨어 호환성 테스트 (AutoCAD, ZWCAD, IntelliCAD)
- 파싱 실패 시 수동 방 그리기 도구
- 예상 규모: 2주

### Phase D: 팀 & 협업 (Business 플랜)
- 팀 멤버 초대 (이메일)
- 프로젝트 공유 (팀원과)
- 권한 관리 (Owner/Editor/Viewer)
- 예상 규모: 1.5주

### Phase E: 자재 마켓플레이스
- 실제 판매 중인 자재 DB 연동 (한샘, LX하우시스 등)
- 자재별 가격 정보
- 시공사 연결 (선택)
- 예상 규모: 3주

### Phase F: 다국어 & 해외 진출
- 영어 / 일본어 UI
- Stripe 결제 (해외)
- 예상 규모: 2주

---

## 현재 개발 상황

- **개발 시작**: 2026-03
- **현재 단계**: SaaS 전환 Phase 1 완료
  - 요금제 + 관리자 편집
  - 사용량 대시보드
  - 워터마크 로직 (비활성)
  - 온보딩 + 샘플 프로젝트
  - 공유 링크
  - 렌더링 히스토리
  - 수정 렌더링
- **다음 단계**: 토스페이먼츠 결제 연동

---

## DB 스키마 (주요 테이블)

```
iso_profiles            — 유저 프로필 (purchased_renders 컬럼 포함)
iso_projects            — 프로젝트 (rooms_data JSONB)
iso_folders             — 프로젝트 폴더
iso_renders             — AI 렌더링 결과 (share_token 지원)
iso_pricing_plans       — 요금제
iso_portfolio_items     — 랜딩 포트폴리오
materials               — 자재 카탈로그
material_categories     — 자재 카테고리
iso_admin_users         — 관리자 계정
```

---

## 참고 자료

- **서비스 URL**: https://isom-neon.vercel.app
- **GitHub**: https://github.com/realks2002-cell/isom (프라이빗)
- **디자인 참고**: Canvas 2D 이소메트릭 프로토타입 기반
- **AI 모델**:
  - `gemini-3.1-flash-image-preview` (빠른 렌더링)
  - `gemini-3-pro-image-preview` (고품질 렌더링)
  - `gemini-2.5-flash` (이미지 분석)

---

## 환경 변수

```
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY
GOOGLE_AI_API_KEY
AI_RENDER_MODEL_FAST
AI_RENDER_MODEL_HIGH
```

---

## 연락처

- 담당자: Kenny
- 이메일: realks22@gmail.com
