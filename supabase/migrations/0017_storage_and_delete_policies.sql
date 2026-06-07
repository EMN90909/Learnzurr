-- Memorial media bucket + upload policies
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'memorial-media',
  'memorial-media',
  true,
  5242880,
  array['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "Anyone can read memorial media" on storage.objects;
create policy "Anyone can read memorial media"
  on storage.objects for select
  using (bucket_id = 'memorial-media');

drop policy if exists "Owners upload memorial media" on storage.objects;
create policy "Owners upload memorial media"
  on storage.objects for insert to authenticated
  with check (
    bucket_id = 'memorial-media'
    and exists (
      select 1 from public.memorial_pages mp
      where mp.id::text = (storage.foldername(name))[1]
        and mp.user_id = auth.uid()
    )
  );

drop policy if exists "Owners update memorial media" on storage.objects;
create policy "Owners update memorial media"
  on storage.objects for update to authenticated
  using (
    bucket_id = 'memorial-media'
    and exists (
      select 1 from public.memorial_pages mp
      where mp.id::text = (storage.foldername(name))[1]
        and mp.user_id = auth.uid()
    )
  );

drop policy if exists "Owners delete memorial media" on storage.objects;
create policy "Owners delete memorial media"
  on storage.objects for delete to authenticated
  using (
    bucket_id = 'memorial-media'
    and exists (
      select 1 from public.memorial_pages mp
      where mp.id::text = (storage.foldername(name))[1]
        and mp.user_id = auth.uid()
    )
  );

-- Listing images bucket for funeral homes / vendors
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'listing-images',
  'listing-images',
  true,
  5242880,
  array['image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do nothing;

drop policy if exists "Anyone read listing images" on storage.objects;
create policy "Anyone read listing images"
  on storage.objects for select
  using (bucket_id = 'listing-images');

drop policy if exists "Providers upload listing images" on storage.objects;
create policy "Providers upload listing images"
  on storage.objects for insert to authenticated
  with check (
    bucket_id = 'listing-images'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "Providers update listing images" on storage.objects;
create policy "Providers update listing images"
  on storage.objects for update to authenticated
  using (
    bucket_id = 'listing-images'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

-- Memorial pages: allow owners to delete
drop policy if exists "Bereaved delete own memorial pages" on public.memorial_pages;
create policy "Bereaved delete own memorial pages"
  on public.memorial_pages for delete to authenticated
  using (user_id = auth.uid());

-- Service requests: allow requester to delete
drop policy if exists "Family delete own service requests" on public.service_requests;
create policy "Family delete own service requests"
  on public.service_requests for delete to authenticated
  using (user_id = auth.uid());

-- User profiles: allow self delete
drop policy if exists "Users delete own profile" on public.user_profiles;
create policy "Users delete own profile"
  on public.user_profiles for delete to authenticated
  using (id = auth.uid());

notify pgrst, 'reload schema';
