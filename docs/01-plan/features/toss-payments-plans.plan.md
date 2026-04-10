---
feature: toss-payments-plans
phase: plan
created: 2026-04-10
type: B2B paid Android app variant
---

# Plan: B2B 유료 Android 앱 (toss-payments-plans)

기존 무료 Android 앱과 별개로 **B2B 유료 플랜 버전**을 출시. 인테리어/건축 사업자 전용, 토스페이먼츠 결제, 플랜별 렌더링 크레딧, 관리자 환불 기능 포함. Google Play 심사는 **B2B 면제 전략**으로 통과 목표.

---

## 확정 전제 (결정 완료)

- ✅ **타겟**: 인테리어/건축 사업자 전용 (B2B)
- ✅ **가입**: 사업자등록번호 **필수 + 국세청 API 검증**
- ✅ **허용 업종**: 중간 수준 (인테리어/건축/가구·조명/부동산/건축기술 등)
- ✅ **결제 경로**: A안 — 앱 내 토스페이먼츠 결제
- ✅ **세금계산서**: 자동 발급 (토스 기본 기능)
- ✅ **플랫폼**: Android 우선 (iOS는 범위 밖)
- ✅ **변형**: 기존 무료 앱과 별도 applicationId로 듀얼 빌드
- ✅ **무료 체험**: 신규 가입자 **AI 렌더링 5건 무료 제공**, 6번째 시도 시 플랜 구매 유도

---

## 무료 체험 (Free Trial) 정책

### 정책
- 신규 가입자에게 **AI 렌더링 5건 무료 이용권** 자동 지급
- 5건 소진 후 6번째 렌더링 시도 → **플랜 구매 모달** 표시 (렌더링 차단)
- 무료 체험 이용권도 `credit_wallets`에 통일된 형태로 저장 (별도 테이블 X)
- 무료 체험 만료일: 가입일 + 30일 (admin 설정 가능)
- 사업자 검증 통과한 계정만 무료 체험 제공 (검증 안 된 계정은 가입 자체 불가)

### 구현 방식
- `profiles` 생성 트리거 또는 가입 완료 API에서 자동으로 trial wallet insert
- `credit_wallets`에 `source` 컬럼 추가: `'trial' | 'purchase'`
- UI: 남은 건수 옆에 `(무료 체험)` 뱃지 표시
- 6번째 시도 시 모달:
  ```
  무료 체험 5건을 모두 사용하셨습니다.
  계속 사용하시려면 플랜을 구매해주세요.
  [플랜 보기] [닫기]
  ```
- 체험 중에도 세금계산서/환불 대상 아님 (무료라서)

### Admin 설정 항목 추가
- `/admin/plans` 하단에 "무료 체험 설정" 섹션
- 무료 체험 건수 (기본 5)
- 무료 체험 유효일 (기본 30일)
- 무료 체험 On/Off 토글 (프로모션 중단용)

### DB 반영
```sql
ALTER TABLE credit_wallets ADD COLUMN source TEXT NOT NULL DEFAULT 'purchase';
-- 'trial' | 'purchase'

-- 시스템 설정 테이블 (무료 체험 포함 범용 설정)
CREATE TABLE app_settings (
  key TEXT PRIMARY KEY,
  value JSONB NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now()
);
INSERT INTO app_settings(key, value) VALUES
  ('trial_credits', '5'::jsonb),
  ('trial_valid_days', '30'::jsonb),
  ('trial_enabled', 'true'::jsonb);
```

### 가입 시 자동 지급 (트리거 또는 API에서)
```sql
-- 가입 시 trial wallet 자동 생성 (예시)
INSERT INTO credit_wallets(user_id, payment_id, total_credits, used_credits, expires_at, source)
VALUES (
  NEW.id,
  NULL,
  (SELECT (value->>0)::int FROM app_settings WHERE key = 'trial_credits'),
  0,
  now() + ((SELECT (value->>0)::int FROM app_settings WHERE key = 'trial_valid_days') || ' days')::interval,
  'trial'
);
```

---

## 플랜 구조

| 플랜 | 기본 가격 | 기본 렌더링 횟수 | 유효기간 |
|---|---|---|---|
| Standard | 20,000원 | admin 설정 | 30일 (admin 설정) |
| Pro | 50,000원 | admin 설정 | 30일 (admin 설정) |
| Premium | 100,000원 | admin 설정 | 30일 (admin 설정) |

- 가격/횟수/유효기간 **모두 admin 페이지에서 변경 가능**
- 구매 시점 가격/횟수를 **스냅샷으로 저장** → 이후 admin 변경해도 기존 구매 영향 없음
- UI 용어: "크레딧" 금지 → **"제안 건수" / "고객 제안 이용권"** 통일

---

## 핵심 기능

### 1. B2B 가입 (사업자 검증)
- 가입 플로우: 이메일/비번 → **사업자번호 입력** → 국세청 API 검증 → 업종 체크 → 통과 시 가입 완료
- 국세청 사업자등록상태조회 API (공공 API, 무료)
- 허용 업종 코드 화이트리스트:
  - `F41224` 인테리어공사업
  - `M71112` 건축설계업
  - `F42xxx` 전문직별 공사업 계열
  - `G47xxx` 가구·조명 소매업 (가구점/조명점)
  - `L68xxx` 부동산업 (분양/리모델링 영업)
  - `M71xxx` 건축기술·엔지니어링 서비스
- 검증 실패 시: "본 앱은 인테리어/건축 사업자 전용입니다. 해당 업종이 아니면 가입이 제한됩니다."
- 상호/대표자명/업태/종목 자동 수집 → `profiles` 테이블 저장

### 2. 토스페이먼츠 결제 (A안)
- SDK: `@tosspayments/tosspayments-sdk` v2
- 플로우: 플랜 선택 → 토스 결제창 → successUrl → `/api/payment/confirm` 서버 승인 → DB 기록 → 크레딧 지급
- **서버 재검증 필수**: 클라이언트가 보내는 amount 무시, `plan_id`로 서버에서 금액 재조회 후 토스 confirm API에 전달
- 멱등성: `order_id` 유니크 제약
- **세금계산서 자동 발급**: 토스 가상계좌/카드 결제 시 사업자 정보 기반 발급 요청

### 3. 크레딧/사용량 (UI: "제안 건수")
- 렌더링 1회 = 1건 차감
- `/api/ai-render` 진입 시 원자적 차감 (PostgreSQL RPC `consume_credit` with row lock)
- 잔액 0이면 렌더링 차단 + "플랜 구매" CTA
- 대시보드/에디터 상단 **남은 제안 건수 상시 표시** (`CreditBadge` 컴포넌트)
- 만료 정책: 구매일 + 플랜 `valid_days` (기본 30일, admin 설정)
- 만료된 크레딧은 cron으로 일일 정리

### 4. 환불 (관리자 전용)

**전액 환불**:
- 해당 결제의 모든 크레딧 회수
- 토스 전액 취소 API 호출
- payment status → `canceled`

**부분 환불**:
- 관리자 입력: "회수할 제안 건수"
- 자동 계산: `refund_amount = paid_amount × (회수 건수 / 총 건수)`
- 사용된 건수는 환불 불가 (사용자가 이미 가치 소비)
- 예: 100건 중 30건 사용 → 70건 회수 → 환불액 = 결제액 × 70/100
- 토스 부분취소 API: `POST /v1/payments/{paymentKey}/cancel` with `cancelAmount`
- 환불 미리보기 UI 필수 (실수 방지)

### 5. 관리자 페이지 확장
기존 `/admin/materials`에 추가:
- `/admin/plans` — 플랜 CRUD (가격, 제안 건수, 유효일)
- `/admin/payments` — 결제 목록 (날짜/유저/상태 필터) + 환불 실행
- `/admin/users` — 유저별 잔여 건수, 사용 이력, 수동 조정 (감사 로그 필수)
- 모든 admin API는 `profiles.role = 'admin'` 검증

---

## Google Play 심사 대응 (B2B 면제 전략)

### 정책 회피 근거 (5중 방어)
1. **사업자번호 필수 + 국세청 API 검증** ← 가장 강력한 증거
2. **업종 화이트리스트** — 일반 소비자 불가능
3. **Play Store 설명 첫 줄**: "인테리어/건축 사업자 전용 B2B 프레젠테이션 도구. 일반 소비자 사용 불가."
4. **세금계산서 자동 발급** — B2B 거래의 결정적 증거
5. **UI 전반 B2B 용어**: "크레딧/토큰/포인트" 금지 → "제안 건수/이용권/견적 건수"

### 필수 체크리스트
- [ ] Play Console 카테고리: **비즈니스**
- [ ] Content Rating: 비즈니스/생산성
- [ ] Target Audience: 성인/사업자
- [ ] Data Safety: 사업자번호, 결제 정보 수집 신고
- [ ] 개인정보처리방침 업데이트 (결제 정보 조항)
- [ ] 이용약관에 "사업자 간 B2B SaaS 거래" 명시
- [ ] 환불 정책 페이지 (`/refund-policy`) 신규 작성
- [ ] 전자상거래법: 사업자 정보/통신판매업 신고번호
- [ ] Target API Level: Android 14 (API 34) 이상
- [ ] 계정 삭제 기능 (기존 구현 재사용, Play Data Safety URL 등록)

### 심사 노트 템플릿
```
This app is a B2B SaaS tool for interior/construction professionals only.
Not available to general consumers.

Business verification is MANDATORY at signup:
- Korean business registration number (국세청 API verified)
- Only allowed business types: interior construction, architectural design,
  furniture/lighting retail, real estate, construction engineering

All transactions are B2B (business-to-business) and accompanied by
tax invoices (세금계산서). Payments are processed via TossPayments,
a licensed Korean PG, as permitted under the Korean Telecommunications
Business Act for B2B transactions.

Demo Account (business-verified test account):
  ID: demo_biz
  Password: [test password]
```

---

## 듀얼 빌드 전략

| 항목 | 무료 버전 (기존) | 유료 Pro 버전 (신규) |
|---|---|---|
| applicationId | `com.bizstart.interiorsim` | `com.bizstart.interiorsim.pro` |
| 앱 이름 | 인테리어 시뮬레이터 | 인테리어 시뮬레이터 Pro |
| server.url | `isom-neon.vercel.app` | `pro.isom-neon.vercel.app` |
| 가입 | 이메일만 | 사업자 검증 필수 |
| 결제 | 없음 | 토스페이먼츠 |
| 렌더링 | 월 100회 고정 | 플랜 기반 제안 건수 |
| Play Store | 기존 등록 | 신규 등록 |

### 분기 방법
- 환경변수 `NEXT_PUBLIC_APP_VARIANT=free|pro`
- Android `productFlavors { free {}, pro { applicationIdSuffix ".pro" } }`
- Vercel 서브도메인 2개 배포
- `src/lib/variant.ts`의 `isPro()` 헬퍼로 UI/기능 분기

---

## 데이터베이스 (Supabase)

### profiles 테이블 확장
```sql
ALTER TABLE profiles ADD COLUMN business_number TEXT UNIQUE;
ALTER TABLE profiles ADD COLUMN business_name TEXT;
ALTER TABLE profiles ADD COLUMN business_ceo TEXT;
ALTER TABLE profiles ADD COLUMN business_type TEXT;      -- 업태
ALTER TABLE profiles ADD COLUMN business_item TEXT;      -- 종목
ALTER TABLE profiles ADD COLUMN business_verified_at TIMESTAMPTZ;
ALTER TABLE profiles ADD COLUMN business_code TEXT;      -- 국세청 업종코드
```

### 신규 테이블
```sql
-- 플랜 정의
CREATE TABLE plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT UNIQUE NOT NULL,          -- 'standard' | 'pro' | 'premium'
  name TEXT NOT NULL,
  price_krw INTEGER NOT NULL,
  render_credits INTEGER NOT NULL,
  valid_days INTEGER NOT NULL DEFAULT 30,
  is_active BOOLEAN DEFAULT true,
  sort_order INTEGER DEFAULT 0,
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 결제 이력
CREATE TABLE payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) NOT NULL,
  plan_id UUID REFERENCES plans(id) NOT NULL,
  order_id TEXT UNIQUE NOT NULL,
  payment_key TEXT,
  amount INTEGER NOT NULL,
  credits_granted INTEGER NOT NULL,
  status TEXT NOT NULL,               -- 'pending'|'done'|'canceled'|'partial_canceled'|'failed'
  refunded_amount INTEGER DEFAULT 0,
  refunded_credits INTEGER DEFAULT 0,
  tax_invoice_issued BOOLEAN DEFAULT false,
  raw_response JSONB,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 크레딧 지갑
CREATE TABLE credit_wallets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) NOT NULL,
  payment_id UUID REFERENCES payments(id),
  total_credits INTEGER NOT NULL,
  used_credits INTEGER DEFAULT 0,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX ON credit_wallets(user_id, expires_at);

-- 사용 로그
CREATE TABLE credit_usage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  wallet_id UUID REFERENCES credit_wallets(id) NOT NULL,
  user_id UUID REFERENCES profiles(id) NOT NULL,
  action TEXT NOT NULL,               -- 'ai_render'|'refund_reclaim'|'admin_adjust'
  delta INTEGER NOT NULL,
  ref_id UUID,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 원자적 크레딧 차감 RPC
CREATE FUNCTION consume_credit(p_user_id UUID, p_action TEXT)
RETURNS INTEGER AS $$
DECLARE
  v_wallet_id UUID;
  v_remaining INTEGER;
BEGIN
  SELECT id INTO v_wallet_id FROM credit_wallets
  WHERE user_id = p_user_id
    AND used_credits < total_credits
    AND expires_at > now()
  ORDER BY expires_at ASC
  LIMIT 1 FOR UPDATE;

  IF v_wallet_id IS NULL THEN
    RAISE EXCEPTION 'no_credits';
  END IF;

  UPDATE credit_wallets SET used_credits = used_credits + 1 WHERE id = v_wallet_id;
  INSERT INTO credit_usage(wallet_id, user_id, action, delta)
    VALUES (v_wallet_id, p_user_id, p_action, -1);

  SELECT COALESCE(SUM(total_credits - used_credits), 0) INTO v_remaining
  FROM credit_wallets WHERE user_id = p_user_id AND expires_at > now();

  RETURN v_remaining;
END; $$ LANGUAGE plpgsql;
```

### RLS
- `plans`: 모두 읽기, admin만 쓰기
- `payments`, `credit_wallets`, `credit_usage`: 본인만 읽기, admin 전체 접근

---

## 신규/수정 파일

### 신규
| 경로 | 역할 |
|---|---|
| `src/app/signup/business/page.tsx` | 사업자 검증 가입 화면 |
| `src/app/api/business/verify/route.ts` | 국세청 API 래퍼 |
| `src/lib/business-verify.ts` | 사업자번호 검증 + 업종 화이트리스트 |
| `src/app/plans/page.tsx` | 플랜 목록/구매 |
| `src/app/plans/checkout/[planId]/page.tsx` | 토스 결제창 호출 |
| `src/app/plans/success/page.tsx` | 결제 성공 리다이렉트 |
| `src/app/plans/fail/page.tsx` | 결제 실패 리다이렉트 |
| `src/app/api/payment/confirm/route.ts` | 토스 승인 + 크레딧 지급 |
| `src/app/api/payment/webhook/route.ts` | 토스 웹훅 (가상계좌 등) |
| `src/app/api/invoice/issue/route.ts` | 세금계산서 발급 |
| `src/app/admin/plans/page.tsx` | 플랜 관리 |
| `src/app/admin/payments/page.tsx` | 결제 목록/환불 |
| `src/app/admin/payments/[id]/refund/route.ts` | 환불 API |
| `src/app/admin/users/page.tsx` | 유저/크레딧 관리 |
| `src/app/refund-policy/page.tsx` | 환불 정책 페이지 |
| `src/components/credit/CreditBadge.tsx` | 상단 남은 건수 표시 |
| `src/lib/toss.ts` | 토스 API (confirm/cancel/partialCancel) |
| `src/lib/credit.ts` | 크레딧 조회/차감 래퍼 |
| `src/lib/variant.ts` | `isPro()` 헬퍼 |
| `supabase/migrations/202604xx_plans_payments.sql` | 스키마 |
| `supabase/migrations/202604xx_profiles_business.sql` | profiles 확장 |

### 수정
| 경로 | 변경 |
|---|---|
| `src/app/api/ai-render/route.ts` | Pro 빌드 시 `consume_credit` RPC 호출 |
| `src/components/ai/AiRenderPanel.tsx` | 남은 건수 표시, 0이면 구매 CTA |
| `src/components/layout/DashboardHeader.tsx` | `<CreditBadge />` 추가 (Pro만) |
| `src/app/api/account/delete/route.ts` | 크레딧/결제 데이터도 정리 |
| `src/app/privacy/page.tsx` | 결제/사업자 정보 수집 조항 |
| `src/app/terms/page.tsx` | B2B SaaS 조항 + 환불 정책 링크 |
| `capacitor.config.ts` | flavor별 server.url |
| `android/app/build.gradle` | productFlavors free/pro |
| `package.json` | `@tosspayments/tosspayments-sdk` |

---

## 실행 단계

### Step 1 — DB 스키마 + 시드
- profiles 확장 마이그레이션
- plans/payments/wallets/usage 마이그레이션
- `consume_credit` RPC 배포
- 기본 플랜 3종 시드 (Standard 20,000/Pro 50,000/Premium 100,000)

### Step 2 — 사업자 검증 가입
- 국세청 사업자등록상태조회 API 연동
- 업종 화이트리스트 검증
- 가입 UI + 에러 메시지
- profiles에 사업자 정보 저장
- 기존 `/` 로그인 화면에 "사업자 회원가입" 링크 추가 (Pro 빌드만)

### Step 3 — 토스페이먼츠 결제
- 테스트 키 발급
- `lib/toss.ts` 작성 (confirm/cancel/partialCancel)
- 플랜 목록 → 결제창 → success/fail 플로우
- 서버 금액 재검증 로직
- 트랜잭션으로 payments + credit_wallets 동시 insert
- 세금계산서 발급 API 연동

### Step 4 — 크레딧 소비 + UI
- `/api/ai-render` variant 체크 후 RPC 호출
- 실패 시 402 + "플랜 구매" CTA
- `CreditBadge` 컴포넌트 (실시간 잔액)
- `AiRenderPanel`에 건수 표시
- UI 전체 "크레딧" → "제안 건수" 치환

### Step 5 — 관리자 페이지
- `/admin/plans` CRUD
- `/admin/payments` 목록 + 환불 다이얼로그 (전액/부분, 미리보기)
- `/admin/users` 검색 + 수동 조정 + 감사 로그
- role 검증 미들웨어

### Step 6 — 듀얼 빌드 구성
- `NEXT_PUBLIC_APP_VARIANT` 환경변수
- `isPro()` 헬퍼로 분기
- Android `productFlavors` 설정
- flavor별 앱 아이콘/이름 리소스
- Vercel `pro.isom-neon.vercel.app` 배포
- `capacitor.config.ts` flavor별 server.url

### Step 7 — Google Play 심사 대응
- 환불 정책/개인정보/이용약관 페이지 업데이트
- Play Console 신규 앱 등록 (`.pro` applicationId)
- Data Safety 신고 (사업자번호, 결제, 세금계산서)
- 심사 노트 작성 (B2B 증거 5중 방어)
- Closed Testing → Production 단계적 출시

---

## 리스크

| 리스크 | 확률 | 대응 |
|---|---|---|
| Google Play B2B 면제 거부 | 중 | 5중 방어 근거 + 심사 노트 명시 + 첫 리젝 시 소명 |
| 국세청 API 장애/지연 | 낮 | 재시도 + 임시 수동 승인 fallback |
| 클라이언트 금액 조작 | 확정 | 서버 재검증 필수 |
| 크레딧 동시 차감 경합 | 중 | RPC + row lock |
| 부분환불 계산 오류 | 중 | 단위 테스트 + 환불 미리보기 필수 |
| 토스 웹훅 미수신 | 낮 | 승인 API 직접 호출 우선, 웹훅은 보조 |
| 기존 무료 앱 사용자 혼란 | 낮 | 별도 applicationId로 완전 분리 |
| 만료 크레딧 미정리 | 낮 | 일일 cron |

---

## 범위 밖 (1차 제외)
- 구독 (월 자동결제) — 1회성 충전만
- iOS Pro 버전 — Android만
- 환불 자동화 정책 (관리자 수동 처리만)
- 다국어 결제
- 무료 플랜 (전환 없음, 플랜 구매 필수)
- 팀/조직 계정 (개인 사업자 단위만)

---

## 검증 체크리스트

1. **사업자 검증**: 유효한 번호 + 허용 업종 → 통과 / 비허용 업종 → 차단
2. **결제 금액 조작**: DevTools로 amount 변경 → 서버 거부 확인
3. **동시 렌더링**: 같은 유저 2탭 동시 렌더링 → 정확히 2 차감
4. **크레딧 소진**: 잔액 0 → 구매 CTA + 렌더링 차단
5. **전액 환불**: 결제 → 환불 → 토스 취소 + 크레딧 0
6. **부분 환불**: 100건 중 30건 사용 → 70건 회수 → 환불액 = 결제액 × 70/100
7. **만료**: 30일 경과 크레딧 자동 만료 확인
8. **세금계산서**: 결제 후 자동 발급 확인
9. **듀얼 빌드**: free/pro flavor 각각 설치/동작 확인
10. **Play Console**: 내부 테스트 트랙 업로드 + Data Safety 제출 성공
