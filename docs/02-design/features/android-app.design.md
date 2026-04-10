# Design: Android 앱 (Remote Load 방식)

- Feature: android-app
- Updated: 2026-04-09
- Phase: Design
- Related Plan: `docs/01-plan/features/android-app.plan.md`

## ⚠️ 절대 제약

**기존 웹 코드(`src/app/**`, `src/components/**`, `src/hooks/**`, `src/types/**`, 기존 `src/lib/**`)는 수정 금지.**

이 제약을 충족하기 위해 **Remote Load 방식**을 채택한다.

## 1. 아키텍처: Remote Load

```
┌──────────────────────────────┐
│  Android APK/AAB             │
│  ┌────────────────────────┐  │
│  │ Capacitor WebView      │  │
│  │                        │  │
│  │  loads ──────────────> │  │
│  │                        │  │
│  └─────────┬──────────────┘  │
└────────────┼─────────────────┘
             │ HTTPS
             ▼
   https://isom-neon.vercel.app
   (기존 Next.js 웹앱 그대로)
   - 이소메트릭 렌더러
   - /api/ai-render, /api/iso-projects...
   - Supabase 연동
```

앱은 **얇은 WebView 래퍼**일 뿐, 모든 로직과 UI는 Vercel 배포된 기존 웹앱이 담당한다.

## 2. 핵심 설정

### capacitor.config.ts
```ts
import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "com.bizstart.interiorsim",
  appName: "인테리어 시뮬레이터",
  webDir: "public",
  server: {
    url: "https://isom-neon.vercel.app",
    androidScheme: "https",
    cleartext: false,
  },
  plugins: {
    SplashScreen: { launchAutoHide: true, backgroundColor: "#ffffff", showSpinner: false },
    StatusBar: { style: "LIGHT" },
  },
  android: { allowMixedContent: false },
};

export default config;
```

**핵심 포인트:**
- `server.url`로 원격 웹앱 로드
- `webDir`은 placeholder (`public` 사용, Capacitor CLI 필수 필드)
- Next.js `output: 'export'` 불필요
- `prebuild/postbuild` 스크립트 불필요
- 웹 코드 0줄 수정

## 3. 장단점

### 장점
- 기존 웹 코드 **0줄 수정**
- Next.js 전체 기능(SSR, API Route, `next/image`, middleware) 그대로 사용
- 웹 배포만으로 앱 업데이트 반영 (스토어 재심사 불필요)
- 유지보수 코드 경로가 하나

### 단점
- **오프라인 동작 불가** (온라인 필수)
- 앱 첫 로딩 시 네트워크 대기
- 네이티브 기능(카메라, 공유, 햅틱)을 쓰려면 `@capacitor/*` JS SDK를 웹 번들에 포함해야 함 → 필요 시 별도 Feature로 추가
- iOS에서는 App Store가 "얇은 래퍼" 앱을 거부하는 경우가 있음 (Android는 비교적 관대)

## 4. Google Play 심사 필수 항목

Remote Load라고 해서 심사 요구사항이 사라지지 않는다:

1. **개인정보처리방침 URL** — `https://isom-neon.vercel.app/privacy` 페이지 필요
2. **계정 삭제 플로우** — 웹 URL에서 접근 가능해야 함 (`/settings/delete-account`)
3. **Data Safety 양식** — Play Console에서 작성
4. **콘텐츠 등급 IARC** — Play Console 설문
5. **AI 콘텐츠 고지** — 웹 UI에 표시
6. **targetSdk 35+** — ✅ (36)
7. **권한 최소화** — ✅ (INTERNET만 필수, 카메라 등은 기능 추가 시)

위 1, 2번은 **웹앱 쪽에서 페이지를 추가**해야 한다. 이건 "기존 코드 수정"이 아니라 "신규 페이지 추가"이므로 제약과 무관하지만, 앱 Feature 범위를 벗어남 → 별도 web Feature로 분리 권장.

## 5. Android 네이티브 설정

### variables.gradle (기본값 충족)
- minSdkVersion 24
- compileSdkVersion 36
- targetSdkVersion 36

### AndroidManifest.xml
- `android:networkSecurityConfig="@xml/network_security_config"`
- `android:usesCleartextTraffic="false"`
- `<uses-permission android:name="android.permission.INTERNET" />`
- (카메라/푸시 등은 필요 시 추후 추가)

### network_security_config.xml
HTTPS only + 시스템 CA만 신뢰.

### build.gradle release
- `minifyEnabled true`, `shrinkResources true`, `proguard-android-optimize.txt`

## 6. 빌드/배포 파이프라인

```
1. 웹 코드 변경 → Vercel 자동 배포
2. 앱 변경이 필요하면:
   - capacitor.config.ts 또는 android/ 수정
   - pnpm cap:sync
   - pnpm cap:open  (Android Studio)
   - Build > Generate Signed Bundle > AAB
   - Play Console 업로드
```

보통은 1단계만 반복하면 된다. 앱 재빌드는 Capacitor/네이티브 설정 변경 시에만.

## 7. 디렉토리 구조

```
capacitor.config.ts           # 신규 (Remote Load 설정)
android/                      # cap add android 결과
  app/
    src/main/
      AndroidManifest.xml     # 권한 + networkSecurityConfig
      res/xml/
        network_security_config.xml
    build.gradle              # release minify
  variables.gradle            # minSdk/target
```

**웹 코드는 아무것도 건드리지 않는다.**

## 8. 테스트 계획

1. `npx cap sync android`
2. `npx cap open android` → Android Studio
3. 에뮬레이터(API 34)에서 `Run` → WebView가 `isom-neon.vercel.app` 로드되는지 확인
4. 핵심 플로우 실기 테스트:
   - [ ] 로그인
   - [ ] DXF 업로드
   - [ ] 이소메트릭 렌더 + 터치 제스처
   - [ ] 마감재 선택
   - [ ] AI 렌더링
   - [ ] PNG 공유 (WebView 기본 공유)
5. 실기기 테스트 (저사양/고사양 2종)

## 9. 완료 조건

- [x] `capacitor.config.ts` Remote Load 설정
- [x] Android 권한 및 보안 설정
- [x] `npx cap sync android` 성공
- [ ] 에뮬레이터에서 웹앱 정상 로드 확인
- [ ] Release AAB 빌드 성공
- [ ] Play Console 내부 테스트 트랙 업로드
- [ ] 심사 제출 (privacy/delete-account 페이지 선행 필요)

## 10. Phase 2 (향후)

Remote Load MVP 이후 네이티브 고도화가 필요하면:
- 오프라인 캐시 (Service Worker 또는 Capacitor Filesystem)
- 네이티브 카메라/공유/햅틱 플러그인 JS 연동 (신규 기능에만)
- FCM 푸시 알림 (AI 렌더 완료)
- Crashlytics

이들은 모두 **기존 웹 코드를 건드리지 않고** 신규 페이지/기능에 추가하는 방식으로 구현한다.
