-- Phase 6: AI 렌더링 히스토리

create table if not exists public.iso_renders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.iso_profiles(id) on delete cascade,
  project_id uuid not null references public.iso_projects(id) on delete cascade,
  storage_path text not null,
  public_url text,
  style text not null,
  quality text not null,
  created_at timestamptz not null default now()
);

create index if not exists idx_iso_renders_user on public.iso_renders(user_id, created_at desc);
create index if not exists idx_iso_renders_project on public.iso_renders(project_id, created_at desc);

alter table public.iso_renders enable row level security;

drop policy if exists "Users can CRUD own renders" on public.iso_renders;
create policy "Users can CRUD own renders"
  on public.iso_renders for all
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
