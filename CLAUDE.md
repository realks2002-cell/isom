# 인테리어 마감재 시뮬레이터 (Interior Finish Simulator)

## 프로젝트 개요

인테리어 업체/건축사가 고객에게 인테리어 완성 이미지를 빠르게 보여주는 **마감재 시뮬레이션 웹앱(SaaS)**.

**핵심 사용 흐름:**
1. 건축사가 CAD 평면도(.dxf)를 업로드한다
2. 시스템이 자동으로 벽/문/창/걸레받이를 인식하여 이소메트릭 3D 뷰로 변환한다
3. 건축사가 각 영역(바닥, 벽, 천장, 걸레받이)을 탭하여 실제 판매 중인 자재(타일, 마루, 벽지 등)를 선택한다
4. 실시간으로 마감재가 반영된 이소메트릭 뷰를 확인한다
5. 완성된 이미지를 PNG로 내보내거나 카톡/이메일로 고객에게 전달한다

**이 프로그램은 정확한 치수 측정 도구가 아니다.** 고객에게 "이런 느낌입니다"를 시각적으로 전달하는 프레젠테이션 도구다. 원근법(이소메트릭)만 갖추면 되고, 디테일한 치수는 불필요하다.

**타겟 디바이스:** 스마트폰 우선. 현장에서 고객 앞에서 실시간으로 보여주며 사용한다. 가볍고 빠르게 동작해야 한다.

---

## 기술 스택

- **프론트엔드:** Next.js 14+ (App Router) + TypeScript
- **렌더링:** Canvas 2D API (Three.js 사용하지 않음 - 모바일 성능 우선)
- **백엔드/DB:** Supabase (Auth, PostgreSQL, Storage, RLS)
- **배포:** Vercel (PWA 설정 포함)
- **CAD 파싱:** dxf-parser (npm 패키지)
- **AI 렌더링:** @google/genai (Nano Banana / Gemini Image API)
- **스타일링:** Tailwind CSS

**사용하지 않는 것:**
- Three.js, WebGL (너무 무겁다)
- Capacitor/네이티브 앱 (PWA로 충분)
- 서버사이드 렌더링이 필요한 무거운 작업

---

## 프로젝트 구조

```
src/
├── app/
│   ├── layout.tsx                 # 루트 레이아웃
│   ├── page.tsx                   # 랜딩/로그인
│   ├── dashboard/
│   │   └── page.tsx               # 프로젝트 목록
│   ├── editor/
│   │   └── [projectId]/
│   │       └── page.tsx           # 메인 에디터 (이소메트릭 뷰어 + 마감재 선택)
│   └── admin/
│       ├── materials/
│       │   └── page.tsx           # 자재 관리 (등록/수정/삭제)
│       └── categories/
│           └── page.tsx           # 카테고리 관리
├── api/
│   └── ai-render/
│       └── route.ts               # Nano Banana AI 렌더링 API 엔드포인트
├── components/
│   ├── canvas/
│   │   ├── IsometricRenderer.tsx  # Canvas 2D 이소메트릭 렌더링 엔진
│   │   ├── FloorRenderer.tsx      # 바닥 패턴 렌더링 (타일, 마루, 헤링본 등)
│   │   ├── WallRenderer.tsx       # 벽체 렌더링 (면별 밝기, 문/창 개구부)
│   │   ├── BaseboardRenderer.tsx  # 걸레받이 렌더링
│   │   └── CameraController.tsx   # 줌, 패닝, 회전 제어
│   ├── ui/
│   │   ├── MaterialPanel.tsx      # 우측 마감재 선택 패널
│   │   ├── MaterialCard.tsx       # 자재 카드 (썸네일 + 이름 + 브랜드)
│   │   ├── CategoryTabs.tsx       # 바닥/벽/걸레받이/천장 탭
│   │   ├── PartSelector.tsx       # 영역 선택 탭 (바닥, 벽, 걸레받이)
│   │   ├── Toolbar.tsx            # 상단 도구 모음
│   │   └── ExportButton.tsx       # PNG 내보내기
│   └── dxf/
│       ├── DxfUploader.tsx        # DXF 파일 업로드 컴포넌트
│       ├── DxfParser.ts           # dxf-parser 래퍼 + 레이어 분류
│       └── LayerMapper.tsx        # 레이어→건축요소 매핑 UI
│   └── ai/
│       ├── AiRenderButton.tsx     # "AI 렌더링" 플로팅 버튼
│       ├── RenderStyleSelector.tsx # 스타일 선택 (모던/클래식/미니멀 등)
│       ├── RenderQualityToggle.tsx # 빠른/고품질 토글
│       ├── RenderPreview.tsx      # 렌더링 결과 전체화면 미리보기
│       ├── RenderCompare.tsx      # 원본 vs AI 슬라이더 비교 뷰
│       └── RenderHistory.tsx      # 과거 렌더링 결과 목록
├── lib/
│   ├── isometric.ts               # 이소메트릭 좌표 변환 유틸리티
│   ├── patterns.ts                # 바닥/벽 패턴 드로잉 함수들
│   ├── materials.ts               # 자재 타입 정의 + 유틸리티
│   ├── dxf-to-rooms.ts            # DXF 파싱 결과 → Room 데이터 변환
│   ├── hit-detection.ts           # 클릭/탭 영역 감지
│   ├── export.ts                  # PNG 내보내기 로직
│   ├── ai-render.ts               # Nano Banana API 호출 + 이미지 변환
│   ├── ai-render-prompts.ts       # AI 렌더링 프롬프트 템플릿
│   └── supabase.ts                # Supabase 클라이언트
├── types/
│   ├── room.ts                    # Room, Wall, Door, Window 타입
│   ├── material.ts                # Material, Category, Brand 타입
│   └── project.ts                 # Project 타입
└── hooks/
    ├── useCanvas.ts               # Canvas 초기화/리사이즈 훅
    ├── useCamera.ts               # 카메라 제어 (줌/팬/회전) 훅
    ├── useTouchGesture.ts         # 모바일 터치 제스처 훅
    ├── useMaterials.ts            # 자재 데이터 fetch 훅
    ├── useProject.ts              # 프로젝트 CRUD 훅
    └── useAiRender.ts             # AI 렌더링 요청/상태 관리 훅
```

---

## 데이터베이스 스키마 (Supabase PostgreSQL)

### profiles 테이블
```sql
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id),
  company_name TEXT,           -- 업체명
  contact_name TEXT,           -- 담당자명
  phone TEXT,
  role TEXT DEFAULT 'user',    -- 'user' | 'admin'
  created_at TIMESTAMPTZ DEFAULT now()
);
```

### projects 테이블
```sql
CREATE TABLE projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) NOT NULL,
  name TEXT NOT NULL,                    -- 프로젝트명 (예: "삼성래미안 301호")
  dxf_file_url TEXT,                     -- Storage 내 DXF 파일 경로
  rooms_data JSONB NOT NULL DEFAULT '[]', -- 파싱된 방 구조 데이터
  materials_config JSONB DEFAULT '{}',   -- 각 영역에 적용된 마감재 설정
  camera_state JSONB DEFAULT '{}',       -- 마지막 카메라 상태 (줌/위치/각도)
  thumbnail_url TEXT,                    -- 프로젝트 썸네일
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
```

### material_categories 테이블
```sql
CREATE TABLE material_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,          -- '바닥-타일', '바닥-마루', '벽-페인트', '벽-타일', '걸레받이' 등
  parent_type TEXT NOT NULL,   -- 'floor' | 'wall' | 'baseboard' | 'ceiling'
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);
```

### materials 테이블
```sql
CREATE TABLE materials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id UUID REFERENCES material_categories(id) NOT NULL,
  name TEXT NOT NULL,                  -- 자재명 (예: "포세린 타일 600x600")
  brand TEXT,                          -- 브랜드 (예: "한샘", "LX하우시스")
  model_number TEXT,                   -- 모델번호
  color_hex TEXT NOT NULL,             -- 대표색 HEX (예: "#D4C5A9")
  pattern_type TEXT NOT NULL,          -- 'tile' | 'wood' | 'herringbone' | 'marble' | 'solid' | 'brick' | 'subway' | 'terrazzo' | 'concrete'
  texture_url TEXT,                    -- Storage 내 텍스처 이미지 경로 (원본)
  texture_thumb_url TEXT,              -- 축소 텍스처 (전체 뷰용)
  texture_medium_url TEXT,             -- 중간 텍스처 (일반 줌용)
  tile_size_mm INTEGER,                -- 실제 타일 크기 mm (600x600 → 600)
  is_preset BOOLEAN DEFAULT false,     -- 기본 프리셋 여부
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);
```

### RLS 정책
```sql
-- projects: 본인 프로젝트만 접근
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can CRUD own projects" ON projects
  FOR ALL USING (auth.uid() = user_id);

-- materials: 모든 인증 유저 읽기 가능, admin만 수정 가능
ALTER TABLE materials ENABLE ROW LEVEL SECURITY;
CREATE POLICY "All users can read materials" ON materials
  FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Admins can manage materials" ON materials
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );
```

---

## 핵심 타입 정의

```typescript
// types/room.ts
interface Point2D {
  x: number;
  y: number;
}

interface Room {
  id: string;
  name: string;                    // "거실", "침실1" 등
  points: Point2D[];               // 바닥 꼭짓점 (시계방향)
  wallHeight: number;              // 벽 높이 (기본 3)
  floor: MaterialAssignment;
  wall: MaterialAssignment;
  baseboard: MaterialAssignment;
  ceiling: MaterialAssignment;
}

interface MaterialAssignment {
  materialId: string;              // materials 테이블 ID
  color: string;                   // HEX 색상
  patternType: string;             // 패턴 종류
  textureUrl?: string;             // 텍스처 이미지 URL
  tileSize?: number;               // 패턴 반복 크기
}

interface Door {
  id: string;
  position: Point2D;               // 문 위치
  direction: 'h' | 'v';           // 수평/수직
  width: number;                   // 문 폭
  connectsRooms: [string, string]; // 연결하는 두 방 ID
}

interface Window {
  id: string;
  position: Point2D;
  direction: 'h' | 'v';
  width: number;
  roomId: string;
}

interface FloorPlan {
  rooms: Room[];
  doors: Door[];
  windows: Window[];
}
```

```typescript
// types/material.ts
interface Material {
  id: string;
  categoryId: string;
  name: string;
  brand?: string;
  modelNumber?: string;
  colorHex: string;
  patternType: PatternType;
  textureUrl?: string;
  textureThumbUrl?: string;
  textureMediumUrl?: string;
  tileSizeMm?: number;
  isPreset: boolean;
}

type PatternType = 'tile' | 'wood' | 'herringbone' | 'marble' | 'solid' | 'brick' | 'subway' | 'terrazzo' | 'concrete';
type PartType = 'floor' | 'wall' | 'baseboard' | 'ceiling';
```

---

## 이소메트릭 렌더링 엔진 규칙

### 좌표 변환
```typescript
// lib/isometric.ts
const SCALE = 38;

function toIso(x: number, y: number, z: number = 0): { x: number; y: number } {
  return {
    x: (x - y) * SCALE * 0.866,
    y: (x + y) * SCALE * 0.5 - z * SCALE,
  };
}

function screenToGrid(sx: number, sy: number): { x: number; y: number } {
  // 화면 좌표 → 그리드 좌표 역변환 (영역 탭 감지용)
}
```

### 렌더링 순서 (Z-order)
1. 방을 (x + y) 합계가 작은 순서로 정렬 (뒤에서 앞으로)
2. 각 방에 대해:
   a. 바닥 그리기 (마름모)
   b. 뒤쪽 벽 그리기 (back, left)
   c. 앞쪽 벽 그리기 (front, right)
   d. 벽 상단 캡 (두께 표현)
3. 방 이름 라벨

### 벽체 렌더링
- 벽의 각 면은 밝기가 다르다 (입체감):
  - 윗면/뒤: 원래 색상
  - 오른쪽 면: 원래 색상 × 0.92
  - 왼쪽 면: 원래 색상 × 0.82
- 벽 상단은 얇은 평행사변형으로 두께 표현 (어두운 색)
- 문 위치에는 개구부 (어두운 사각형)
- 창문 위치에는 반투명 파란 사각형 + 십자 프레임

### 바닥 패턴 렌더링
- **tile**: 이소메트릭 변환된 그리드 줄눈선
- **wood**: 이소메트릭 방향의 가는 평행선 (나뭇결) + 판재 구분선
- **herringbone**: 대각선 교차 패턴
- **marble**: 기본색 + 불규칙 얼룩 (seeded random)
- **terrazzo**: 기본색 + 작은 원형 점들 (seeded random)
- **concrete**: 기본색 + 불규칙 가는 선 (seeded random)
- **solid**: 단색 (줄눈선 없음)

### 텍스처 LOD (Level of Detail)
- **전체 뷰 (줌 < 0.7)**: 대표색 + 간략 패턴 힌트 (줄눈선만)
- **일반 뷰 (줌 0.7~1.5)**: 축소 텍스처(thumb) 또는 패턴 렌더링
- **확대 뷰 (줌 > 1.5)**: 고해상도 텍스처(medium/원본)

Canvas의 `setTransform()`으로 이소메트릭 각도에 맞게 텍스처를 변환한 후 `createPattern()`으로 매핑.

---

## DXF 파싱 규칙

### 파싱 파이프라인
```
.dxf 파일 업로드
  → dxf-parser로 JSON 변환
  → 레이어별 엔티티 분류
  → LINE, POLYLINE, LWPOLYLINE에서 벽체 좌표 추출
  → 닫힌 영역(방) 자동 감지
  → Room[] 데이터 생성
  → 이소메트릭 렌더러에 전달
```

### 레이어 매핑
DXF 파일의 레이어 이름은 업체마다 다를 수 있으므로, 업로드 후 레이어 목록을 보여주고 사용자가 매핑하는 UI를 제공한다:
- "이 레이어는 벽입니다"
- "이 레이어는 문입니다"
- "이 레이어는 창문입니다"

자주 쓰이는 레이어명 자동 감지: `WALL`, `벽`, `DOOR`, `문`, `WINDOW`, `창`, `A-WALL`, `A-DOOR` 등.

### 주의사항
- DXF 파일의 단위(mm, cm, m)를 감지하여 정규화
- 좌표 원점이 다를 수 있으므로 중앙 정렬 처리
- 곡선 벽(ARC)은 1단계에서는 무시하고 직선 벽만 처리
- 파싱 실패 시 친절한 에러 메시지 + 수동 입력 안내

---

## 마감재 선택 UX 플로우

### 인터랙션
1. 사용자가 이소메트릭 뷰에서 **바닥/벽 영역을 탭**
2. 우측(모바일은 하단)에서 **마감재 선택 패널** 슬라이드 인
3. 패널 상단에 **파트 탭** (바닥 | 벽 | 걸레받이)
4. 탭 아래에 **카테고리 필터** (타일, 마루, 페인트 등)
5. 자재 카드 그리드 (썸네일 + 이름 + 브랜드)
6. 자재 카드 탭 → **즉시 이소메트릭 뷰에 반영**
7. 패널 닫기 또는 다른 영역 탭으로 이동

### 2탭 원칙
고객 앞에서 사용하는 도구이므로, 영역 탭 → 자재 탭 = **최대 2번의 탭으로 마감재 변경 완료**.

### 모바일 우선 레이아웃
- 데스크톱: 우측 260px 사이드 패널
- 모바일: 하단 50% 높이 바텀시트 (드래그로 높이 조절)

---

## 터치 제스처

- **1-finger drag**: 캔버스 패닝 (이동)
- **2-finger pinch**: 줌 인/아웃 (최소 0.3x ~ 최대 3x)
- **1-finger tap**: 영역 선택 (바닥/벽 감지)
- **더블탭**: 줌 리셋 또는 영역 확대

마우스 이벤트도 동시 지원:
- **drag**: 패닝
- **wheel**: 줌
- **click**: 영역 선택

---

## PNG 내보내기

- 내보내기 해상도: 1920×1080 (고정)
- 배경: 흰색
- 줌/위치는 전체 평면이 잘 보이도록 자동 조정
- Web Share API 사용하여 모바일에서 바로 카톡/메일 공유 가능
- 폴백: download 링크

---

## 개발 순서 (단계별)

### Phase 1: 프로젝트 세팅 + 인증 (1주차)
- [ ] Next.js + TypeScript + Tailwind 초기화
- [ ] Supabase 프로젝트 생성 + 테이블 마이그레이션
- [ ] Supabase Auth (이메일/비번 로그인)
- [ ] 프로젝트 목록 (대시보드) CRUD
- [ ] 기본 레이아웃 (헤더, 사이드바)

### Phase 2: DXF 파싱 엔진 (2주차)
- [ ] dxf-parser 설치 + DXF 파일 파싱
- [ ] 레이어 목록 표시 + 매핑 UI
- [ ] LINE/POLYLINE → 벽 좌표 추출
- [ ] 닫힌 영역 → Room 데이터 자동 생성
- [ ] 문/창문 감지
- [ ] 파싱 결과를 projects.rooms_data에 저장

### Phase 3: 이소메트릭 렌더러 (3주차)
- [ ] Canvas 2D 초기화 + 리사이즈 처리
- [ ] 이소메트릭 좌표 변환 (toIso)
- [ ] 바닥 렌더링 (마름모 + 패턴)
- [ ] 벽체 렌더링 (면별 밝기 + 문/창 개구부)
- [ ] Z-order 정렬 (페인터 알고리즘)
- [ ] 걸레받이 렌더링
- [ ] 카메라 제어 (줌, 패닝, 회전)
- [ ] 터치 제스처 (핀치 줌, 1-finger drag)
- [ ] 영역 탭 감지 (hit detection)

### Phase 4: 마감재 시스템 (4주차)
- [ ] 자재 DB 시딩 (기본 프리셋 30~50종)
- [ ] 마감재 선택 패널 UI
- [ ] 파트 탭 (바닥/벽/걸레받이)
- [ ] 카테고리 필터
- [ ] 자재 선택 → 즉시 렌더링 반영
- [ ] 텍스처 LOD 구현
- [ ] 관리자 페이지: 자재 등록/수정/삭제
- [ ] 자재 이미지 업로드 (Supabase Storage)
- [ ] 텍스처 리사이즈 자동 생성 (thumb, medium)

### Phase 5: 마무리 (5주차)
- [ ] PNG 내보내기 (1920×1080)
- [ ] Web Share API 공유
- [ ] 프로젝트 저장/불러오기 완성
- [ ] PWA manifest + service worker
- [ ] 반응형 레이아웃 최적화 (모바일/데스크톱)
- [ ] Vercel 배포
- [ ] QA + 실기기 테스트

### Phase 6: AI 포토리얼 렌더링 - Nano Banana (6주차)
- [ ] Google AI API 키 발급 + 환경변수 설정
- [ ] Next.js API Route: `/api/ai-render` 엔드포인트 생성
- [ ] Canvas → PNG base64 캡처 → Gemini API 전송 로직
- [ ] AI 렌더링 프롬프트 템플릿 시스템
- [ ] 렌더링 결과 미리보기 + 원본 비교 UI
- [ ] 렌더링 결과 PNG 저장/공유
- [ ] 렌더링 히스토리 저장 (Supabase Storage)
- [ ] 로딩 상태 UI (렌더링 소요 시간 안내)
- [ ] 에러 핸들링 (API 실패, 과금 한도 초과 등)

---

## AI 포토리얼 렌더링 (Nano Banana)

### 개요
Canvas 2D로 그린 이소메트릭 평면도를 Nano Banana (Gemini Image API)에 입력하여 포토리얼리스틱한 인테리어 완성 이미지로 변환하는 기능.

사용자 흐름:
1. 이소메트릭 뷰에서 마감재 적용 완료
2. "AI 렌더링" 버튼 탭
3. 렌더링 스타일 선택 (선택사항)
4. 5~15초 대기 후 포토리얼 이미지 출력
5. 원본 이소메트릭 vs AI 렌더링 비교 뷰
6. 만족하면 PNG 저장 또는 카톡 공유

### API 연동

모델: `gemini-3.1-flash-image-preview` (Nano Banana 2, 속도 우선)
또는: `gemini-3-pro-image-preview` (Nano Banana Pro, 품질 우선)

사용자에게 "빠른 렌더링" / "고품질 렌더링" 선택 옵션 제공.

```typescript
// lib/ai-render.ts
import { GoogleGenAI } from "@google/genai";

interface RenderOptions {
  style: 'modern' | 'classic' | 'minimal' | 'luxury' | 'scandinavian';
  quality: 'fast' | 'high';  // fast = flash, high = pro
  aspectRatio?: string;
}

async function renderWithNanoBanana(
  imageBase64: string,
  roomsData: Room[],
  materialsApplied: Record<string, MaterialAssignment>,
  options: RenderOptions
): Promise<string> {
  const ai = new GoogleGenAI({ apiKey: process.env.GOOGLE_AI_API_KEY });

  const model = options.quality === 'fast'
    ? 'gemini-3.1-flash-image-preview'
    : 'gemini-3-pro-image-preview';

  // 적용된 마감재 정보를 프롬프트에 포함
  const materialDescription = buildMaterialPrompt(roomsData, materialsApplied);

  const prompt = buildRenderPrompt(materialDescription, options.style);

  const response = await ai.models.generateContent({
    model,
    contents: [
      {
        role: "user",
        parts: [
          {
            inlineData: {
              mimeType: "image/png",
              data: imageBase64,
            },
          },
          { text: prompt },
        ],
      },
    ],
  });

  // 응답에서 이미지 추출
  for (const part of response.candidates[0].content.parts) {
    if (part.inlineData) {
      return part.inlineData.data; // base64 이미지
    }
  }
  throw new Error("AI 렌더링 결과에 이미지가 없습니다.");
}
```

### 프롬프트 템플릿

```typescript
// lib/ai-render-prompts.ts

function buildMaterialPrompt(
  rooms: Room[],
  materials: Record<string, MaterialAssignment>
): string {
  // 각 방에 적용된 마감재를 자연어로 설명
  // 예: "거실 바닥은 포세린 타일(600x600mm, 베이지), 벽은 화이트 페인트,
  //      걸레받이는 오크 우드. 주방 바닥은 폴리싱 타일..."
  return rooms.map(room => {
    return `${room.name}: 바닥=${room.floor.name || room.floor.patternType}, ` +
           `벽=${room.wall.name || 'white paint'}, ` +
           `걸레받이=${room.baseboard.name || 'white PVC'}`;
  }).join('. ');
}

function buildRenderPrompt(materialDesc: string, style: string): string {
  const styleDescriptions: Record<string, string> = {
    modern: 'modern contemporary interior design with clean lines and neutral tones',
    classic: 'classic elegant interior with warm tones and refined details',
    minimal: 'minimalist interior with white walls, natural light, and sparse furnishing',
    luxury: 'high-end luxury interior with premium materials and sophisticated lighting',
    scandinavian: 'Scandinavian interior with light wood, white walls, and cozy natural textures',
  };

  return `Transform this isometric floor plan into a photorealistic interior rendering.

This is an isometric architectural floor plan showing rooms with applied finish materials.
Render it as a photorealistic 3D interior visualization from the same isometric perspective.

Applied materials:
${materialDesc}

Style: ${styleDescriptions[style] || styleDescriptions.modern}

Requirements:
- Keep the same isometric camera angle and room layout
- Render walls, floors, baseboards with realistic textures matching the specified materials
- Add realistic lighting: soft ambient light from windows, subtle shadows on walls and floors
- Add realistic ceiling with recessed lighting
- Keep rooms empty (no furniture), focus on architectural finishes only
- Photorealistic quality with accurate material reflections and surface detail
- Clean, professional architectural visualization style`;
}
```

### Next.js API Route

```typescript
// app/api/ai-render/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { renderWithNanoBanana } from '@/lib/ai-render';
import { createClient } from '@/lib/supabase-server';

export async function POST(req: NextRequest) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: '인증 필요' }, { status: 401 });

  const { imageBase64, roomsData, materialsApplied, options } = await req.json();

  try {
    const resultBase64 = await renderWithNanoBanana(
      imageBase64, roomsData, materialsApplied, options
    );

    // Storage에 결과 저장
    const fileName = `renders/${user.id}/${Date.now()}.png`;
    const buffer = Buffer.from(resultBase64, 'base64');
    await supabase.storage.from('renders').upload(fileName, buffer, {
      contentType: 'image/png',
    });

    const { data: { publicUrl } } = supabase.storage
      .from('renders')
      .getPublicUrl(fileName);

    return NextResponse.json({
      imageBase64: resultBase64,
      savedUrl: publicUrl,
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'AI 렌더링 실패. 잠시 후 다시 시도해주세요.' },
      { status: 500 }
    );
  }
}
```

### UI 컴포넌트

```
src/components/ai/
├── AiRenderButton.tsx         # "AI 렌더링" 플로팅 버튼
├── RenderStyleSelector.tsx    # 스타일 선택 (모던/클래식/미니멀/럭셔리/스칸디)
├── RenderQualityToggle.tsx    # 빠른 렌더링 / 고품질 렌더링 토글
├── RenderPreview.tsx          # 렌더링 결과 미리보기 (전체화면 오버레이)
├── RenderCompare.tsx          # 원본 vs AI 슬라이더 비교 뷰
└── RenderHistory.tsx          # 과거 렌더링 결과 목록
```

### 과금 고려사항
- Nano Banana (Flash): ~$0.039/이미지 (빠른 렌더링용)
- Nano Banana Pro: 더 높은 가격 (고품질용)
- 사용자에게 렌더링 횟수를 표시하고, 업체별 월간 렌더링 한도를 설정할 수 있도록 함
- 렌더링 전 "AI 렌더링 1회가 차감됩니다" 확인 다이얼로그 표시

### 환경변수
```env
GOOGLE_AI_API_KEY=your-google-ai-api-key
AI_RENDER_MODEL_FAST=gemini-3.1-flash-image-preview
AI_RENDER_MODEL_HIGH=gemini-3-pro-image-preview
AI_RENDER_MONTHLY_LIMIT=100  # 업체당 월간 렌더링 한도
```

---

## 코딩 규칙

- TypeScript strict mode
- 컴포넌트는 함수형 + hooks
- 상태 관리: React state + Context (Zustand는 필요시)
- Canvas 관련 로직은 `lib/` 아래에 순수 함수로 분리하고, React 컴포넌트에서 호출
- 모든 Supabase 쿼리는 `hooks/` 아래 커스텀 훅으로 감싸기
- 에러 처리: try/catch + 사용자 친화적 toast 메시지
- 한국어 UI (라벨, 버튼, 안내 메시지 모두 한국어)
- 모바일 퍼스트: min-width 미디어쿼리로 데스크톱 확장

---

## 참고: 프로토타입 코드

이 프로젝트의 Canvas 2D 이소메트릭 렌더링은 이미 프로토타입으로 검증되었다.
프로토타입 파일 `prototype/isometric-prototype.html`을 참고하여 렌더링 로직을 구현할 것.

프로토타입에서 검증된 것:
- toIso() 좌표 변환 공식
- 바닥 패턴 렌더링 5종 (tile, wood, herringbone, terrazzo, concrete)
- 벽체 면별 밝기 차이 (0.82, 0.92 계수)
- 문/창문 개구부 표현
- 벽 상단 두께 캡
- 마우스/터치 패닝, 휠 줌, 핀치 줌
- 영역 탭 → 마감재 선택 → 즉시 반영 UX
- PNG 내보내기 (1920×1080)

---

## 절대 하지 말 것

- Three.js, WebGL, Babylon.js 등 3D 라이브러리 사용 금지 (Canvas 2D만 사용)
- 정밀 치수 계산 로직 불필요 (이소메트릭 원근법만 갖추면 됨)
- 가구/소품 배치 기능 불필요
- 복잡한 조명/그림자 시뮬레이션 불필요
- 무거운 상태관리 라이브러리 (Redux 등) 사용 금지
- SSR이 필요 없는 에디터 페이지에 불필요한 서버 컴포넌트 사용 금지

---

## Phase 7+: iOS / Android 네이티브 앱 고도화 (향후)

> 이 섹션은 Phase 1~6 웹앱 완성 이후 진행하는 고도화 로드맵이다.
> Phase 1~6 개발 시에는 이 섹션을 참고만 하고, 네이티브 전환을 미리 준비하는 코드 구조를 유지한다.

### 전환 전략: Capacitor 하이브리드 앱

웹앱을 처음부터 다시 만들지 않는다. Next.js 웹앱 위에 Capacitor를 씌워서 네이티브 래핑한다.
이 프로젝트의 기존 스택(Next.js + Capacitor)과 동일한 패턴이다.

```
기존 Next.js 웹앱 (Phase 1~6)
  ↓ Capacitor 래핑
iOS 앱 (.ipa) + Android 앱 (.apk/.aab)
  ↓ 스토어 배포
App Store + Google Play
```

### 네이티브 전환 시 추가되는 것

#### 7-1. Capacitor 설정 + 네이티브 프로젝트 생성
```bash
npm install @capacitor/core @capacitor/cli
npx cap init "InteriorSimulator" "com.bizstart.interiorsim"
npx cap add ios
npx cap add android
```

capacitor.config.ts:
```typescript
import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.bizstart.interiorsim',
  appName: '인테리어 시뮬레이터',
  webDir: 'out',              // Next.js static export
  server: {
    androidScheme: 'https',
  },
  plugins: {
    SplashScreen: {
      launchAutoHide: true,
      androidScaleType: 'CENTER_CROP',
    },
    StatusBar: {
      style: 'DARK',
    },
  },
};

export default config;
```

#### 7-2. Next.js Static Export 설정
네이티브 앱에서는 Vercel 서버가 없으므로 `next export`로 정적 빌드한다.

next.config.js 수정:
```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',           // 네이티브 빌드 시 활성화
  images: {
    unoptimized: true,        // next/image 서버 최적화 비활성화
  },
};
module.exports = nextConfig;
```

**주의: API Routes (`/api/ai-render` 등)는 static export에서 작동하지 않는다.**
→ Supabase Edge Functions로 이전하거나, 별도 API 서버(Vercel 유지)를 호출하는 구조로 변경.

```typescript
// lib/api-client.ts
// 웹: 상대경로 /api/ai-render
// 네이티브: 절대경로 https://your-app.vercel.app/api/ai-render
const API_BASE = process.env.NEXT_PUBLIC_API_BASE || '';

export async function apiPost(path: string, body: any) {
  const res = await fetch(`${API_BASE}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  return res.json();
}
```

#### 7-3. 네이티브 기능 활용

**카메라로 현장 촬영 → AI 렌더링 입력:**
```typescript
import { Camera, CameraResultType } from '@capacitor/camera';

// 현장 사진 촬영 → AI 렌더링에 참고 이미지로 활용
const photo = await Camera.getPhoto({
  quality: 80,
  resultType: CameraResultType.Base64,
  source: CameraSource.Camera,
});
```

**파일 시스템 (DXF 파일 로컬 저장):**
```typescript
import { Filesystem, Directory } from '@capacitor/filesystem';

// 프로젝트 데이터 로컬 캐시 (오프라인 지원)
await Filesystem.writeFile({
  path: `projects/${projectId}.json`,
  data: JSON.stringify(projectData),
  directory: Directory.Data,
});
```

**공유 (네이티브 공유 시트):**
```typescript
import { Share } from '@capacitor/share';

// PNG 내보내기 후 네이티브 공유 (카톡, 메일 등)
await Share.share({
  title: '인테리어 시뮬레이션',
  text: `${projectName} - 마감재 시뮬레이션 결과`,
  url: renderImageUrl,
  dialogTitle: '시뮬레이션 결과 공유',
});
```

**푸시 알림 (렌더링 완료 알림):**
```typescript
import { PushNotifications } from '@capacitor/push-notifications';
// FCM 토큰 등록 → AI 렌더링 완료 시 푸시 알림
```

**햅틱 피드백 (자재 선택 시):**
```typescript
import { Haptics, ImpactStyle } from '@capacitor/haptics';
// 자재 카드 탭 시 가벼운 진동 피드백
await Haptics.impact({ style: ImpactStyle.Light });
```

#### 7-4. 오프라인 지원
- 자재 카탈로그 이미지를 로컬에 캐시 (Capacitor Filesystem)
- 프로젝트 데이터를 로컬 SQLite에 저장 (네트워크 없을 때도 편집 가능)
- 온라인 복귀 시 Supabase와 동기화
- AI 렌더링은 온라인 필수 (API 호출)

#### 7-5. 스토어 배포 준비

**iOS (App Store):**
- Xcode에서 `ios/App` 프로젝트 열기
- Apple Developer 계정 ($99/년)
- 앱 아이콘 (1024×1024) + 스크린샷 (6.7", 6.1", iPad)
- App Store Connect에 앱 등록
- 심사 제출 (보통 1~3일)

**Android (Google Play):**
- Android Studio에서 `android/` 프로젝트 열기
- Google Play Developer 계정 ($25 일회성)
- 앱 아이콘 (512×512) + 스크린샷
- AAB (Android App Bundle) 빌드
- Google Play Console에 앱 등록
- 내부/비공개 테스트 → 프로덕션 출시

#### 7-6. 네이티브 앱 전용 추가 기능 (선택)

**ARKit/ARCore 연동 (고급):**
실제 공간을 카메라로 비추면 벽/바닥에 마감재를 AR로 오버레이.
→ 이건 Capacitor만으로는 어렵고, 네이티브 모듈(Swift/Kotlin) 개발이 필요.
→ 2차 고도화 또는 별도 프로젝트로 분리 권장.

**Apple Pencil / S Pen 지원:**
태블릿에서 간이 편집기로 벽을 직접 그리는 기능.
→ Canvas 터치 이벤트에 pressure/tilt 파라미터 추가.

### 네이티브 전환 예상 일정
- Capacitor 설정 + 빌드 파이프라인: 3일
- API 호출 구조 변경 (상대경로 → 절대경로): 2일
- 네이티브 기능 연동 (카메라, 공유, 파일): 3일
- 오프라인 캐시 구현: 3일
- 스토어 에셋 제작 + 심사 제출: 3일
- **총 약 2주**

### Phase 1~6에서 미리 준비할 것 (중요)

네이티브 전환을 수월하게 하려면 Phase 1~6 개발 시 아래를 지켜야 한다:

1. **API 호출을 한 곳에서 관리**: `lib/api-client.ts`에서 `API_BASE`를 환경변수로 분기. 컴포넌트에서 직접 `fetch('/api/...')` 하지 않는다.
2. **next/image 의존 최소화**: `<img>` 태그 또는 자체 Image 컴포넌트 사용. `next/image`는 Vercel 서버 의존적이라 static export에서 문제.
3. **next/link 대신 useRouter**: Capacitor에서 라우팅 호환성을 위해.
4. **window/document 접근 시 가드**: `typeof window !== 'undefined'` 체크. SSR/SSG 빌드 시 에러 방지.
5. **환경변수 분리**: `NEXT_PUBLIC_` 접두사로 클라이언트 변수 관리. 네이티브에서는 `.env` 대신 capacitor.config.ts의 server 설정 사용.
6. **서비스워커 충돌 방지**: PWA 서비스워커와 Capacitor WebView가 충돌할 수 있으므로, Capacitor 빌드 시 서비스워커 비활성화하는 분기 추가.

```typescript
// lib/platform.ts
export function isNative(): boolean {
  return typeof window !== 'undefined' &&
    (window as any).Capacitor?.isNativePlatform?.() === true;
}

export function isWeb(): boolean {
  return !isNative();
}

// 사용 예시
if (isNative()) {
  // Capacitor Share API 사용
  await Share.share({ url: imageUrl });
} else {
  // Web Share API 또는 download 링크
  if (navigator.share) {
    await navigator.share({ url: imageUrl });
  } else {
    downloadAsLink(imageUrl);
  }
}
```
