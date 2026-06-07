-- Chat / request file attachments (not tied to memorial_pages)
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'request-media',
  'request-media',
  true,
  10485760,
  array['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'application/pdf']
)
on conflict (id) do nothing;

drop policy if exists "Anyone read request media" on storage.objects;
create policy "Anyone read request media"
  on storage.objects for select
  using (bucket_id = 'request-media');

drop policy if exists "Participants upload request media" on storage.objects;
create policy "Participants upload request media"
  on storage.objects for insert to authenticated
  with check (
    bucket_id = 'request-media'
    and exists (
      select 1 from public.service_requests sr
      where sr.id::text = (storage.foldername(name))[1]
        and (sr.user_id = auth.uid() or sr.provider_id = auth.uid())
    )
  );

drop policy if exists "Participants delete request media" on storage.objects;
create policy "Participants delete request media"
  on storage.objects for delete to authenticated
  using (
    bucket_id = 'request-media'
    and exists (
      select 1 from public.service_requests sr
      where sr.id::text = (storage.foldername(name))[1]
        and (sr.user_id = auth.uid() or sr.provider_id = auth.uid())
    )
  );

alter table public.user_profiles add column if not exists business_country text default 'Kenya';

notify pgrst, 'reload schema';
