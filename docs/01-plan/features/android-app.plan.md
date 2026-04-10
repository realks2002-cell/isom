# Plan: Android 앱 (인테리어 마감재 시뮬레이터)

- Feature: android-app
- Created: 2026-04-09
- Phase: Plan
- Owner: -

## ⚠️ 절대 제약 (CRITICAL)

**안드로이드 앱 작업 중에는 기존 웹 코드를 절대 수정하지 않는다.**

- 금지 대상: `src/app/**`, `src/components/**`, `src/hooks/**`, `src/types/**`, 기존 `src/lib/**` 파일
- 금지 행위: 기존 `fetch('/api/...')` 호출부 수정, `next/image` 교체, 컴포넌트 리팩터
- 허용 영역: `capacitor.config.ts`, `next.config.ts`(조건부 분기만), `scripts/`, `android/`, **신규** `src/lib/platform.ts` / `api-client.ts` / `share.ts` 등 앱 전용 신규 파일
- 웹/앱 분기가 필요하면 **신규 래퍼 파일에서만** 처리하고 기존 파일은 그대로 둔다
- `NEXT_PUBLIC_API_BASE`가 비어있으면 상대경로(`/api/...`)로 동작 → 웹 빌드는 기존 동작 유지되므로 기존 코드 수정 불필요
- 네이티브 빌드에서 기존 `fetch('/api/...')` 호출을 외부 도메인으로 보내려면:
  - 방안 A: 네이티브 빌드 시 WebView `server.url`을 Vercel 배포 URL로 지정하여 원격 웹앱을 로드(하이브리드 로딩)
  - 방안 B: Capacitor `server.hostname` + CORS 설정으로 `/api` 경로를 Vercel로 프록시
  - 코드 수정 없이 설정만으로 해결

## 1. 배경 및 목표

기존 Next.js 웹앱(Phase 1~6)을 **Capacitor 하이브리드**로 래핑하여 Google Play Store에 배포한다. 네이티브 재개발 없이 단일 코드베이스를 유지하며, 현장에서 건축사가 태블릿/폰으로 고객에게 즉시 시뮬레이션을 보여주는 UX를 강화한다.

## 2. 성공 지표

- Google Play 심사 1회 통과
- 앱 초기 로딩 < 3초 (중급 안드로이드 기준)
- 크래시 프리 세션율 > 99%
- APK/AAB 크기 < 50MB
- DXF 업로드 → 이소메트릭 렌더링 플로우가 네이티브에서도 동작

## 3. 기술 스택 (Google Play 심사 최적화)

| 영역 | 선택 | 비고 |
|---|---|---|
| 래퍼 | Capacitor 6 | 활발한 유지보수, Play 정책 대응 빠름 |
| 웹 빌드 | Next.js `output: 'export'` | 정적 빌드 → WebView |
| 최소 SDK | minSdk 24 (Android 7) | 커버리지 95%+ |
| 타겟 SDK | targetSdk 35 (Android 15) | 2025-08 이후 신규 앱 필수 |
| 빌드 포맷 | AAB (App Bundle) | Play Store 필수 |
| 서명 | Play App Signing | 키 유실 방지 |
| 네트워크 | HTTPS only + Network Security Config | cleartext 차단 |
| API | 원격 Vercel API (`NEXT_PUBLIC_API_BASE`) | static export는 API Route 불가 |
| 저장 | Supabase + `@capacitor/preferences` | 토큰 안전 저장 |
| 네이티브 기능 | `@capacitor/camera`, `share`, `filesystem`, `haptics` | |
| 푸시 | Firebase FCM + `@capacitor/push-notifications` | AI 렌더링 완료 알림 |
| 크래시 | Firebase Crashlytics | 품질 모니터링 |
| 무결성 | Play Integrity API (선택) | 권장 |

## 4. Google Play 심사 체크리스트

1. Data Safety 양식 (Supabase 수집 데이터 명시)
2. 개인정보처리방침 URL (웹 호스팅 필수)
3. 권한 최소화 (카메라/저장소만, scoped storage)
4. AI 생성 콘텐츠 정책 (Nano Banana 사용 고지 + 신고 기능)
5. 계정 삭제 기능 (인앱 + 웹, 2024 필수)
6. 콘텐츠 등급 IARC 설문
7. 64-bit 네이티브 (Capacitor 기본 충족)
8. targetSdk 35
9. Play App Signing 활성화된 AAB
10. 신규 개인 계정: 클로즈드 테스트 20명 / 14일

## 5. 작업 단계

### Step 1. Capacitor 셋업 (1일)
- 패키지 설치: `@capacitor/core @capacitor/cli @capacitor/android`
- `npx cap init "InteriorSimulator" "com.bizstart.interiorsim"`
- `npx cap add android`
- `capacitor.config.ts` 작성 (webDir: `out`, androidScheme: `https`)

### Step 2. 웹앱 호환성 수정 (2일)
- `next.config.js`에 `output: 'export'` + `images.unoptimized: true`
- `lib/api-client.ts`: `NEXT_PUBLIC_API_BASE` 절대경로 분기
- `lib/platform.ts`: `isNative()` 헬퍼
- `next/image` → `<img>` 교체
- `window`/`document` SSR 가드 전수 점검
- Service Worker 네이티브 빌드 시 비활성화 분기

### Step 3. 네이티브 플러그인 통합 (2일)
- Camera (현장 촬영 → AI 렌더 참고 이미지)
- Share (PNG 공유)
- Filesystem (DXF/프로젝트 로컬 캐시)
- Preferences (토큰 저장)
- Haptics (자재 탭 피드백)
- 권한 거부 시 UX 안내

### Step 4. Android 설정 (1일)
- `AndroidManifest.xml`: 권한, targetSdk 35
- `network_security_config.xml`: HTTPS only
- Adaptive Icon (512×512 + foreground/background)
- 스플래시 스크린 (`@capacitor/splash-screen`)
- ProGuard/R8 설정

### Step 5. FCM + Crashlytics (1일)
- Firebase 프로젝트 + `google-services.json`
- AI 렌더링 완료 푸시
- Crashlytics SDK 연동

### Step 6. 심사 자료 준비 (2일)
- 개인정보처리방침 페이지 (`/privacy`)
- 계정 삭제 플로우 (인앱 + 웹)
- Data Safety 양식 초안
- 스크린샷 (폰 4장, 태블릿 2장)
- 앱 설명 (짧은 80자, 전체 4000자)
- 콘텐츠 등급 설문

### Step 7. 테스트 → 프로덕션 (3~5일 + 14일 대기)
- `./gradlew bundleRelease`로 AAB 빌드
- 내부 테스트 트랙 업로드
- 클로즈드 테스트 20명 / 14일 (신규 개인 계정)
- 프로덕션 제출 → 심사 1~7일

## 6. 리스크 및 대응

| 리스크 | 영향 | 대응 |
|---|---|---|
| 신규 계정 14일 테스트 | 출시 지연 | 계획 초반에 테스터 모집 시작 |
| API Route 불가 | AI 렌더링 구조 변경 | Vercel API를 원격 호출, CORS 설정 |
| DXF 파일 접근 | Android SAF 복잡 | `@capacitor/filesystem` + Document Picker |
| WebView 성능 | 저사양 기기 느림 | 텍스처 LOD 적극 적용, minSdk 24 |
| 앱 크기 초과 | 50MB 제한 | Dynamic Delivery, 텍스처 원격 로딩 |
| 백그라운드 AI 지연 | 렌더 도중 종료 | FCM 푸시로 결과 알림 |

## 7. 일정

- 개발: 약 9일
- 심사/테스트 대기: 2~3주
- **총 3~4주**

## 8. 완료 조건 (Definition of Done)

- [ ] Android Studio에서 release AAB 빌드 성공
- [ ] 내부 테스트 트랙에서 핵심 플로우(로그인, DXF 업로드, 마감재 적용, AI 렌더, PNG 공유) 동작 확인
- [ ] Play Console 심사 통과
- [ ] Crashlytics 연동 및 첫 리포트 수신
- [ ] 개인정보처리방침 + 계정 삭제 기능 라이브
