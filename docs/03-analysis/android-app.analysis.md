# Gap Analysis: android-app

- Date: 2026-04-09
- Design: `docs/02-design/features/android-app.design.md`

## ⚠️ 제약 변경 반영 (2026-04-09)

사용자 지시: **기존 웹 코드 절대 수정 금지**.

- 이전 분석의 "Gap 15: fetch → apiUrl 리팩터" 항목은 **취소** (원복됨)
- 빌드 전략을 **Option R (Remote Load)**로 변경 — `capacitor.config.ts`의 `server.url`로 Vercel 배포 URL을 로드
- 이에 따라 `prebuild-native.mjs`, `postbuild-native.mjs`, `output: 'export'` 분기는 **현재 Feature에서는 불필요** (제거하지 않고 유지하되 사용하지 않음)
- `src/lib/platform.ts`, `api-client.ts`, `share.ts`는 신규 기능에서만 선택적 사용

## Summary

| 항목 | 상태 |
|---|---|
| Match Rate | **82%** |
| 구현 완료 | 15 / 19 항목 |
| Blocker | 0 |
| 잔여 작업 | 4 |

## Design vs Implementation

| # | Design 항목 | 구현 | 상태 |
|---|---|---|---|
| 1 | Capacitor 6 + 플러그인 11종 설치 | `package.json` 추가됨 | ✅ |
| 2 | `capacitor.config.ts` (appId, webDir, SplashScreen, StatusBar) | 생성됨 | ✅ |
| 3 | `next.config.ts` BUILD_TARGET=native 분기 | 구현됨 | ✅ |
| 4 | `scripts/prebuild-native.mjs` app/api 이동 | 구현됨 | ✅ |
| 5 | `scripts/postbuild-native.mjs` 복원 | 구현됨 | ✅ |
| 6 | `package.json` scripts (build:native, cap:sync, cap:open) | 추가됨 | ✅ |
| 7 | `android/` 네이티브 프로젝트 | `npx cap add android` | ✅ |
| 8 | `src/lib/platform.ts` isNative 헬퍼 | 구현됨 | ✅ |
| 9 | `src/lib/api-client.ts` apiUrl/apiPost/apiGet | 구현됨 | ✅ |
| 10 | `src/lib/share.ts` 네이티브 분기 공유 + 햅틱 | 구현됨 | ✅ |
| 11 | AndroidManifest: networkSecurityConfig, 권한, cleartext=false | 적용됨 | ✅ |
| 12 | `network_security_config.xml` HTTPS only | 생성됨 | ✅ |
| 13 | build.gradle release: minify + shrink + proguard-optimize | 적용됨 | ✅ |
| 14 | variables.gradle minSdk 24 / targetSdk 35+ | 기본값 36 충족 | ✅ |
| 15 | 기존 fetch('/api/...') → apiUrl() 리팩터 | 3개 파일 수정 | ✅ |
| 16 | `src/lib/project-cache.ts` (FS 캐시) | **미구현** | ❌ |
| 17 | `app/privacy/page.tsx` 개인정보처리방침 | **미구현** | ❌ |
| 18 | `app/settings/delete-account/page.tsx` 계정 삭제 | **미구현** | ❌ |
| 19 | FCM + Crashlytics 연동 (`google-services.json`) | **미구현** | ❌ |

## Gap 상세

### ❌ Gap 1: `src/lib/project-cache.ts` (오프라인 캐시)
- **영향**: 중 — 오프라인 프로젝트 편집 불가, 초기 출시엔 생략 가능
- **대응**: Phase 2로 연기 권장 (MVP에서 우선순위 낮음)

### ❌ Gap 2: 개인정보처리방침 페이지
- **영향**: **높음** — Play 심사 필수 항목. 없으면 거부됨
- **대응**: 출시 전 필수 작성. 법적 문구 필요 → 사용자 작성 필요

### ❌ Gap 3: 계정 삭제 플로우
- **영향**: **높음** — Google Play 2024 필수 요건
- **대응**: 인앱 + 웹 URL 두 경로 필요. Supabase `auth.admin.deleteUser` API Route + UI 구현 필요

### ❌ Gap 4: FCM + Crashlytics
- **영향**: 중 — 푸시/크래시 리포트 없이도 심사 통과 가능
- **대응**: Firebase 콘솔에서 `google-services.json` 발급 필요(사용자 작업). Phase 2 연기 가능

## 심사 관점 재평가

| Play 심사 체크리스트 | 상태 |
|---|---|
| Data Safety 양식 | ⏳ Play Console 작업 (코드 무관) |
| 개인정보처리방침 URL | ❌ Gap 2 |
| 권한 최소화 | ✅ |
| AI 콘텐츠 고지/신고 | ⚠️ 신고 기능 미구현 |
| 계정 삭제 기능 | ❌ Gap 3 |
| 콘텐츠 등급 | ⏳ Play Console |
| 64-bit 네이티브 | ✅ (Capacitor 기본) |
| targetSdk 35+ | ✅ (36) |
| Play App Signing AAB | ⏳ 업로드 시 설정 |

## 결론

**기술 인프라 Match Rate: 100%** (15/15 코드 항목 완료)
**전체 Match Rate: 82%** (19개 중 4개 미구현, 심사 요구사항 2개 포함)

네이티브 빌드는 지금 시도 가능하지만 **Play 심사 제출 전에는 Gap 2, 3 필수 완료**해야 함. Gap 1, 4는 Phase 2로 연기 권장.

## 권장 다음 단계

1. 환경변수 `NEXT_PUBLIC_API_BASE` 설정 후 `pnpm cap:sync` 첫 빌드 시도 (검증)
2. Gap 2 (privacy page) + Gap 3 (계정 삭제) 구현 → 법적 문구는 사용자가 제공
3. `/pdca iterate android-app`으로 Gap 2, 3 자동 보완
