import { createClient } from '@supabase/supabase-js';

// Service Role 클라이언트 — 서버 전용. 클라이언트 컴포넌트에서 import 금지.
export function createAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}

export const ID_DOMAIN = '@isometrix.local';
export const toEmail = (id: string) => `${id.trim().toLowerCase()}${ID_DOMAIN}`;
export const fromEmail = (email: string) =>
  email.endsWith(ID_DOMAIN) ? email.slice(0, -ID_DOMAIN.length) : email;
