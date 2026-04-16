-- 요금제 테이블
CREATE TABLE IF NOT EXISTS iso_pricing_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,            -- 'Standard', 'Pro', 'Max'
  slug TEXT NOT NULL UNIQUE,     -- 'standard', 'pro', 'max'
  price INTEGER NOT NULL,        -- 월 가격 (원)
  render_limit INTEGER NOT NULL, -- 월 렌더링 횟수
  project_limit INTEGER NOT NULL DEFAULT -1, -- 프로젝트 수 제한 (-1 = 무제한)
  features JSONB NOT NULL DEFAULT '[]', -- 기능 목록 (문자열 배열)
  is_popular BOOLEAN DEFAULT false,     -- "Most Popular" 배지
  is_active BOOLEAN DEFAULT true,       -- 활성/비활성
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- RLS
ALTER TABLE iso_pricing_plans ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read active plans" ON iso_pricing_plans
  FOR SELECT USING (is_active = true);
CREATE POLICY "Admins can manage plans" ON iso_pricing_plans
  FOR ALL USING (
    EXISTS (SELECT 1 FROM iso_profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- 초기 데이터
INSERT INTO iso_pricing_plans (name, slug, price, render_limit, project_limit, features, is_popular, sort_order)
VALUES
  ('Standard', 'standard', 10000, 10, 5,
   '["AI 렌더링 월 10회", "프로젝트 5개", "Quick Render", "DXF/DWG 업로드", "이소메트릭 뷰", "워터마크 포함"]',
   false, 1),
  ('Pro', 'pro', 30000, 35, -1,
   '["AI 렌더링 월 35회", "무제한 프로젝트", "Quick Render", "고품질 렌더링", "AI 마감재 분석", "워터마크 없음", "마감재 명세서 PDF", "공유 링크"]',
   true, 2),
  ('Max', 'max', 50000, 65, -1,
   '["AI 렌더링 월 65회", "무제한 프로젝트", "팀 멤버 5명", "고품질 렌더링", "AI 마감재 분석", "워터마크 없음", "마감재 명세서 PDF", "공유 링크", "브랜드 로고 삽입", "우선 지원"]',
   false, 3);
