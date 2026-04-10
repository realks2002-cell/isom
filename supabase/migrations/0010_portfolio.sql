-- Portfolio items for landing page (admin-managed)

create table if not exists public.iso_portfolio_items (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  subtitle text,
  status text not null default 'active',
  thumbnail_url text,
  layer_count int default 0,
  tags text[] default '{}',
  sort_order int default 0,
  is_active boolean default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.iso_portfolio_items enable row level security;

drop policy if exists "Public read active portfolio" on public.iso_portfolio_items;
create policy "Public read active portfolio"
  on public.iso_portfolio_items for select
  to anon, authenticated
  using (is_active = true);

drop policy if exists "Admins manage portfolio" on public.iso_portfolio_items;
create policy "Admins manage portfolio"
  on public.iso_portfolio_items for all
  to authenticated
  using (public.is_admin(auth.uid()))
  with check (public.is_admin(auth.uid()));

-- Storage bucket
insert into storage.buckets (id, name, public)
  values ('iso-portfolio', 'iso-portfolio', true)
  on conflict (id) do nothing;

drop policy if exists "Public read portfolio thumbs" on storage.objects;
create policy "Public read portfolio thumbs"
  on storage.objects for select
  to anon, authenticated
  using (bucket_id = 'iso-portfolio');

drop policy if exists "Admins write portfolio thumbs" on storage.objects;
create policy "Admins write portfolio thumbs"
  on storage.objects for all
  to authenticated
  using (bucket_id = 'iso-portfolio' and public.is_admin(auth.uid()))
  with check (bucket_id = 'iso-portfolio' and public.is_admin(auth.uid()));
