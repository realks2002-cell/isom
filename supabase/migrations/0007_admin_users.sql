-- Admin user management: 추가 프로필 컬럼 + 평문 비번 저장 + 마스터 관리자 시드

-- ============================================================
-- iso_profiles 컬럼 확장
-- ============================================================
alter table public.iso_profiles add column if not exists name text;
alter table public.iso_profiles add column if not exists address text;
alter table public.iso_profiles add column if not exists admin_memo text;

-- ============================================================
-- iso_user_credentials: 평문 비밀번호 (관리자만 조회)
-- ⚠️ 보안 경고: 평문 저장은 관리자 요구사항. RLS로 엄격 제한.
-- ============================================================
create table if not exists public.iso_user_credentials (
  user_id uuid primary key references public.iso_profiles(id) on delete cascade,
  plain_password text not null,
  updated_at timestamptz not null default now()
);

alter table public.iso_user_credentials enable row level security;

drop policy if exists "Only admins read credentials" on public.iso_user_credentials;
create policy "Only admins read credentials"
  on public.iso_user_credentials for select
  to authenticated
  using (
    exists (
      select 1 from public.iso_profiles
      where id = auth.uid() and role = 'admin'
    )
  );
-- insert/update/delete 정책 없음 = Service Role Key로만 접근 가능

-- ============================================================
-- 관리자 전체 프로필 조회 정책
-- ============================================================
drop policy if exists "Admins can view all profiles" on public.iso_profiles;
create policy "Admins can view all profiles"
  on public.iso_profiles for select
  to authenticated
  using (
    exists (
      select 1 from public.iso_profiles p
      where p.id = auth.uid() and p.role = 'admin'
    )
  );

-- ============================================================
-- 마스터 관리자 시드 안내
-- ============================================================
-- 아래 절차를 Supabase Studio에서 수동 실행:
--
-- 1) Authentication > Users > Add user
--    Email: realks22@isometrix.local
--    Password: Ks2002
--    (Auto confirm user 체크)
--
-- 2) SQL Editor에서 아래 실행:
--
-- update public.iso_profiles
--   set name='마스터', role='admin'
--   where id = (select id from auth.users where email = 'realks22@isometrix.local');
--
-- insert into public.iso_user_credentials (user_id, plain_password)
--   values (
--     (select id from auth.users where email = 'realks22@isometrix.local'),
--     'Ks2002'
--   )
--   on conflict (user_id) do update set plain_password = excluded.plain_password;
