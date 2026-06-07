-- Fix provider_payment_profiles RLS policies
alter table public.provider_payment_profiles enable row level security;

-- Drop existing policies if they exist
drop policy if exists "providers_can_manage_own_profiles" on public.provider_payment_profiles;
drop policy if exists "admin_can_manage_all" on public.provider_payment_profiles;

-- Allow providers to select their own profile
create policy "provider_read_own" on public.provider_payment_profiles
  for select
  to authenticated
  using (provider_id = auth.uid());

-- Allow providers to insert their own profile
create policy "provider_create_own" on public.provider_payment_profiles
  for insert
  to authenticated
  with check (provider_id = auth.uid());

-- Allow providers to update their own profile
create policy "provider_update_own" on public.provider_payment_profiles
  for update
  to authenticated
  using (provider_id = auth.uid());

-- Allow admins to view all profiles
create policy "admin_read_all" on public.provider_payment_profiles
  for select
  to authenticated
  using (
    (select exists(select 1 from public.admin_emails where email = auth.jwt()->>'email'))
  );

-- Allow admins to update all profiles
create policy "admin_update_all" on public.provider_payment_profiles
  for update
  to authenticated
  using (
    (select exists(select 1 from public.admin_emails where email = auth.jwt()->>'email'))
  );

-- Notify PostgREST to reload schema
select pgrst.http_notify(
  'http://localhost:3001/rpc/db_change_notification',
  json_build_object('action', 'reload_schema')
);
