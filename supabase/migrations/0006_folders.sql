-- 폴더 테이블 + iso_projects.folder_id 추가
create table public.iso_folders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.iso_profiles(id) on delete cascade,
  name text not null,
  color text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index idx_iso_folders_user on public.iso_folders(user_id);

alter table public.iso_folders enable row level security;

create policy "Users CRUD own folders"
  on public.iso_folders for all
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create trigger iso_folders_touch_updated
  before update on public.iso_folders
  for each row execute function iso_touch_updated_at();

-- iso_projects에 folder_id 추가
alter table public.iso_projects
  add column folder_id uuid references public.iso_folders(id) on delete set null;

create index idx_iso_projects_folder on public.iso_projects(folder_id);
