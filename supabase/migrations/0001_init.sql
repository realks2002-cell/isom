-- Interior Finish Simulator - Initial Schema
-- Phase 1: iso_profiles, iso_projects, iso_material_categories, iso_materials + RLS

-- ============================================================
-- iso_profiles
-- ============================================================
create table if not exists public.iso_profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  company_name text,
  contact_name text,
  phone text,
  role text not null default 'user' check (role in ('user', 'admin')),
  created_at timestamptz not null default now()
);

alter table public.iso_profiles enable row level security;

drop policy if exists "Users can view own profile" on public.iso_profiles;
create policy "Users can view own profile"
  on public.iso_profiles for select
  to authenticated
  using (auth.uid() = id);

drop policy if exists "Users can update own profile" on public.iso_profiles;
create policy "Users can update own profile"
  on public.iso_profiles for update
  to authenticated
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- 회원가입 시 iso_profiles 자동 생성 트리거
create or replace function public.iso_handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.iso_profiles (id)
  values (new.id);
  return new;
end;
$$;

drop trigger if exists on_auth_user_created_iso on auth.users;
create trigger on_auth_user_created_iso
  after insert on auth.users
  for each row execute function public.iso_handle_new_user();

-- ============================================================
-- iso_projects
-- ============================================================
create table if not exists public.iso_projects (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.iso_profiles(id) on delete cascade,
  name text not null,
  dxf_file_url text,
  rooms_data jsonb not null default '[]'::jsonb,
  materials_config jsonb not null default '{}'::jsonb,
  camera_state jsonb not null default '{}'::jsonb,
  thumbnail_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_iso_projects_user_id on public.iso_projects(user_id);
create index if not exists idx_iso_projects_updated_at on public.iso_projects(updated_at desc);

alter table public.iso_projects enable row level security;

drop policy if exists "Users can CRUD own projects" on public.iso_projects;
create policy "Users can CRUD own projects"
  on public.iso_projects for all
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- updated_at 자동 갱신
create or replace function public.iso_touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_iso_projects_updated_at on public.iso_projects;
create trigger trg_iso_projects_updated_at
  before update on public.iso_projects
  for each row execute function public.iso_touch_updated_at();

-- ============================================================
-- iso_material_categories
-- ============================================================
create table if not exists public.iso_material_categories (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  parent_type text not null check (parent_type in ('floor', 'wall', 'baseboard', 'ceiling', 'door')),
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

alter table public.iso_material_categories enable row level security;

drop policy if exists "Authenticated users can read categories" on public.iso_material_categories;
create policy "Authenticated users can read categories"
  on public.iso_material_categories for select
  to authenticated
  using (true);

drop policy if exists "Admins can manage categories" on public.iso_material_categories;
create policy "Admins can manage categories"
  on public.iso_material_categories for all
  to authenticated
  using (
    exists (
      select 1 from public.iso_profiles
      where id = auth.uid() and role = 'admin'
    )
  )
  with check (
    exists (
      select 1 from public.iso_profiles
      where id = auth.uid() and role = 'admin'
    )
  );

-- ============================================================
-- iso_materials
-- ============================================================
create table if not exists public.iso_materials (
  id uuid primary key default gen_random_uuid(),
  category_id uuid not null references public.iso_material_categories(id) on delete restrict,
  name text not null,
  brand text,
  model_number text,
  color_hex text not null,
  pattern_type text not null check (
    pattern_type in ('tile', 'wood', 'herringbone', 'marble', 'solid', 'brick', 'subway', 'terrazzo', 'concrete')
  ),
  texture_url text,
  texture_thumb_url text,
  texture_medium_url text,
  tile_size_mm integer,
  is_preset boolean not null default false,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create index if not exists idx_iso_materials_category on public.iso_materials(category_id);
create index if not exists idx_iso_materials_active on public.iso_materials(is_active) where is_active = true;

alter table public.iso_materials enable row level security;

drop policy if exists "Authenticated users can read active materials" on public.iso_materials;
create policy "Authenticated users can read active materials"
  on public.iso_materials for select
  to authenticated
  using (is_active = true);

drop policy if exists "Admins can manage materials" on public.iso_materials;
create policy "Admins can manage materials"
  on public.iso_materials for all
  to authenticated
  using (
    exists (
      select 1 from public.iso_profiles
      where id = auth.uid() and role = 'admin'
    )
  )
  with check (
    exists (
      select 1 from public.iso_profiles
      where id = auth.uid() and role = 'admin'
    )
  );

-- ============================================================
-- Storage buckets (수동 생성 후 실행)
-- ============================================================
-- dashboard에서 다음 버킷 생성:
--   iso-dxf-files       (private)
--   iso-material-textures (public)
--   iso-renders         (private)
--   iso-thumbnails      (public)
