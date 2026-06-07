-- Add is_banned column to user_profiles
alter table public.user_profiles add column if not exists is_banned boolean default false;

-- Create index for faster ban lookups
create index if not exists user_profiles_is_banned_idx on public.user_profiles(is_banned);

-- Update Subscriptions RLS to allow admin full access
drop policy if exists "Subscriptions select related" on public.subscriptions;
drop policy if exists "Subscriptions insert related" on public.subscriptions;
drop policy if exists "Subscriptions update related" on public.subscriptions;

create policy "Subscriptions select related" on public.subscriptions
  for select to authenticated
  using (
    user_id = (select auth.uid()) 
    or provider_id = (select auth.uid()) 
    or home_id = (select auth.uid()) 
    or vendor_id = (select auth.uid())
    or exists (select 1 from public.user_profiles up where up.id = (select auth.uid()) and up.role = 'admin')
  );

create policy "Subscriptions insert related" on public.subscriptions
  for insert to authenticated
  with check (
    user_id = (select auth.uid()) 
    or provider_id = (select auth.uid()) 
    or home_id = (select auth.uid()) 
    or vendor_id = (select auth.uid())
    or exists (select 1 from public.user_profiles up where up.id = (select auth.uid()) and up.role = 'admin')
  );

create policy "Subscriptions update related" on public.subscriptions
  for update to authenticated
  using (
    user_id = (select auth.uid()) 
    or provider_id = (select auth.uid()) 
    or home_id = (select auth.uid()) 
    or vendor_id = (select auth.uid())
    or exists (select 1 from public.user_profiles up where up.id = (select auth.uid()) and up.role = 'admin')
  )
  with check (
    user_id = (select auth.uid()) 
    or provider_id = (select auth.uid()) 
    or home_id = (select auth.uid()) 
    or vendor_id = (select auth.uid())
    or exists (select 1 from public.user_profiles up where up.id = (select auth.uid()) and up.role = 'admin')
  );

-- Update Payments RLS to allow admin full access
drop policy if exists "Payments select related" on public.payments;

create policy "Payments select related" on public.payments
  for select to authenticated
  using (
    user_id = (select auth.uid()) 
    or provider_id = (select auth.uid()) 
    or home_id = (select auth.uid()) 
    or vendor_id = (select auth.uid())
    or exists (select 1 from public.user_profiles up where up.id = (select auth.uid()) and up.role = 'admin')
  );

create policy "Payments insert admin" on public.payments
  for insert to authenticated
  with check (
    exists (select 1 from public.user_profiles up where up.id = (select auth.uid()) and up.role = 'admin')
  );

create policy "Payments update admin" on public.payments
  for update to authenticated
  using (
    exists (select 1 from public.user_profiles up where up.id = (select auth.uid()) and up.role = 'admin')
  )
  with check (
    exists (select 1 from public.user_profiles up where up.id = (select auth.uid()) and up.role = 'admin')
  );

notify pgrst, 'reload schema';
