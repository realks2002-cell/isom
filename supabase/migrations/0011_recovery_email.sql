-- Recovery email for password reset (login ID based auth)

alter table public.iso_profiles
  add column if not exists recovery_email text;

create index if not exists idx_iso_profiles_recovery_email
  on public.iso_profiles (recovery_email);
