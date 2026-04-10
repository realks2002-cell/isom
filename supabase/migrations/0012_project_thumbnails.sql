-- Storage bucket for project thumbnails

insert into storage.buckets (id, name, public)
  values ('iso-projects', 'iso-projects', true)
  on conflict (id) do nothing;

drop policy if exists "Users read own project files" on storage.objects;
create policy "Users read own project files"
  on storage.objects for select
  to anon, authenticated
  using (bucket_id = 'iso-projects');

drop policy if exists "Users write own project files" on storage.objects;
create policy "Users write own project files"
  on storage.objects for all
  to authenticated
  using (bucket_id = 'iso-projects' and (storage.foldername(name))[2] = auth.uid()::text)
  with check (bucket_id = 'iso-projects' and (storage.foldername(name))[2] = auth.uid()::text);
