-- Phase 1~6: Storage buckets

insert into storage.buckets (id, name, public)
values
  ('iso-dxf-files', 'iso-dxf-files', false),
  ('iso-material-textures', 'iso-material-textures', true),
  ('iso-renders', 'iso-renders', false),
  ('iso-thumbnails', 'iso-thumbnails', true)
on conflict (id) do nothing;

-- iso-dxf-files: 본인 폴더만 rw
drop policy if exists "Users can manage own dxf files" on storage.objects;
create policy "Users can manage own dxf files"
  on storage.objects for all
  to authenticated
  using (bucket_id = 'iso-dxf-files' and (storage.foldername(name))[1] = auth.uid()::text)
  with check (bucket_id = 'iso-dxf-files' and (storage.foldername(name))[1] = auth.uid()::text);

-- iso-renders: 본인 폴더만 rw (private이지만 RLS로 제어)
drop policy if exists "Users can manage own renders" on storage.objects;
create policy "Users can manage own renders"
  on storage.objects for all
  to authenticated
  using (bucket_id = 'iso-renders' and (storage.foldername(name))[1] = auth.uid()::text)
  with check (bucket_id = 'iso-renders' and (storage.foldername(name))[1] = auth.uid()::text);

-- iso-material-textures: 인증 유저 read, admin만 write
drop policy if exists "Authenticated read material textures" on storage.objects;
create policy "Authenticated read material textures"
  on storage.objects for select
  to authenticated
  using (bucket_id = 'iso-material-textures');

drop policy if exists "Admins manage material textures" on storage.objects;
create policy "Admins manage material textures"
  on storage.objects for all
  to authenticated
  using (
    bucket_id = 'iso-material-textures'
    and exists (select 1 from public.iso_profiles where id = auth.uid() and role = 'admin')
  )
  with check (
    bucket_id = 'iso-material-textures'
    and exists (select 1 from public.iso_profiles where id = auth.uid() and role = 'admin')
  );

-- iso-thumbnails: 본인 폴더만 rw + public read
drop policy if exists "Users can manage own thumbnails" on storage.objects;
create policy "Users can manage own thumbnails"
  on storage.objects for all
  to authenticated
  using (bucket_id = 'iso-thumbnails' and (storage.foldername(name))[1] = auth.uid()::text)
  with check (bucket_id = 'iso-thumbnails' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists "Public read thumbnails" on storage.objects;
create policy "Public read thumbnails"
  on storage.objects for select
  to public
  using (bucket_id = 'iso-thumbnails');
