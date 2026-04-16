-- 렌더링 공유 토큰
ALTER TABLE iso_renders ADD COLUMN IF NOT EXISTS share_token TEXT UNIQUE;
CREATE INDEX IF NOT EXISTS idx_iso_renders_share ON iso_renders(share_token) WHERE share_token IS NOT NULL;

-- 비로그인 사용자도 share_token으로 읽기 가능
CREATE POLICY "Anyone can read shared renders" ON iso_renders
  FOR SELECT USING (share_token IS NOT NULL);
