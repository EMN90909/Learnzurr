-- Fix production schema drift where staff/provider code expects owner_user_id.
-- Safe to run more than once.

alter table if exists public.erp_staff
  add column if not exists owner_user_id uuid;

alter table if exists public.funeral_homes
  add column if not exists owner_user_id uuid;

alter table if exists public.vendors
  add column if not exists owner_user_id uuid;

alter table if exists public.user_profiles
  add column if not exists owner_user_id uuid;

-- Backfill aliases from the columns this app already uses in different releases.
do $$
begin
  if to_regclass('public.user_profiles') is not null then
    update public.user_profiles
       set owner_user_id = coalesce(owner_user_id, id)
     where owner_user_id is null;
  end if;

  if to_regclass('public.erp_staff') is not null then
    update public.erp_staff
       set owner_user_id = coalesce(owner_user_id, user_id)
     where owner_user_id is null
       and exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'erp_staff' and column_name = 'user_id');
  end if;

  if to_regclass('public.funeral_homes') is not null then
    if exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'funeral_homes' and column_name = 'user_id') then
      update public.funeral_homes set owner_user_id = coalesce(owner_user_id, user_id) where owner_user_id is null;
    elsif exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'funeral_homes' and column_name = 'profile_id') then
      update public.funeral_homes set owner_user_id = coalesce(owner_user_id, profile_id) where owner_user_id is null;
    end if;
  end if;

  if to_regclass('public.vendors') is not null then
    if exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'vendors' and column_name = 'user_id') then
      update public.vendors set owner_user_id = coalesce(owner_user_id, user_id) where owner_user_id is null;
    elsif exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'vendors' and column_name = 'profile_id') then
      update public.vendors set owner_user_id = coalesce(owner_user_id, profile_id) where owner_user_id is null;
    end if;
  end if;
end $$;

create index if not exists idx_erp_staff_owner_user_id on public.erp_staff(owner_user_id);
create index if not exists idx_funeral_homes_owner_user_id on public.funeral_homes(owner_user_id);
create index if not exists idx_vendors_owner_user_id on public.vendors(owner_user_id);
create index if not exists idx_user_profiles_owner_user_id on public.user_profiles(owner_user_id);
