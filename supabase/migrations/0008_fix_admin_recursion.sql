-- Fix infinite recursion in iso_profiles RLS policy
-- Root cause: 0007_admin_users.sql created policy "Admins can view all profiles"
-- on iso_profiles that SELECTs from iso_profiles itself, causing infinite recursion.
-- This also broke ALL Storage uploads because storage.objects policies reference
-- iso_profiles for admin checks.
--
-- Fix: use a SECURITY DEFINER function that bypasses RLS to check admin role.

-- ============================================================
-- 1) is_admin() helper — bypasses RLS via SECURITY DEFINER
-- ============================================================
create or replace function public.is_admin(uid uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.iso_profiles
    where id = uid and role = 'admin'
  );
$$;

-- 함수 실행 권한
grant execute on function public.is_admin(uuid) to authenticated, anon, service_role;

-- ============================================================
-- 2) iso_profiles 재귀 정책 교체
-- ============================================================
drop policy if exists "Admins can view all profiles" on public.iso_profiles;
create policy "Admins can view all profiles"
  on public.iso_profiles for select
  to authenticated
  using (public.is_admin(auth.uid()));

-- ============================================================
-- 3) iso_user_credentials 정책도 동일하게 교체 (같은 패턴)
-- ============================================================
drop policy if exists "Only admins read credentials" on public.iso_user_credentials;
create policy "Only admins read credentials"
  on public.iso_user_credentials for select
  to authenticated
  using (public.is_admin(auth.uid()));

-- ============================================================
-- 4) Storage 정책도 함수 사용으로 교체 (재귀 방지 + 일관성)
-- ============================================================
drop policy if exists "Admins manage material textures" on storage.objects;
create policy "Admins manage material textures"
  on storage.objects for all
  to authenticated
  using (
    bucket_id = 'iso-material-textures'
    and public.is_admin(auth.uid())
  )
  with check (
    bucket_id = 'iso-material-textures'
    and public.is_admin(auth.uid())
  );
