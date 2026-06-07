alter table public.memorial_pages enable row level security;

drop policy if exists "Bereaved delete own memorial pages" on public.memorial_pages;
drop policy if exists "Memorial pages delete own" on public.memorial_pages;
drop policy if exists "Users can delete own memorial pages" on public.memorial_pages;

create policy "Users can delete own memorial pages"
  on public.memorial_pages
  for delete
  to authenticated
  using (user_id = (select auth.uid()));

notify pgrst, 'reload schema';
