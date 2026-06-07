create extension if not exists pgcrypto;

create table if not exists public.referrals (
  id uuid primary key default gen_random_uuid(),
  referrer_user_id uuid references auth.users(id) on delete set null,
  referred_user_id uuid references auth.users(id) on delete set null,
  referral_code text not null,
  landing_path text,
  signup_role text,
  visitor_id text,
  user_agent text,
  ip_hash text,
  converted_at timestamptz,
  created_at timestamptz not null default now(),
  metadata jsonb not null default '{}'::jsonb
);

create index if not exists referrals_referrer_user_id_idx on public.referrals(referrer_user_id);
create index if not exists referrals_referred_user_id_idx on public.referrals(referred_user_id);
create index if not exists referrals_referral_code_idx on public.referrals(referral_code);
create index if not exists referrals_created_at_idx on public.referrals(created_at desc);

alter table public.user_profiles add column if not exists referred_by uuid references auth.users(id) on delete set null;
alter table public.user_profiles add column if not exists referral_code text;
alter table public.user_profiles add column if not exists branch_of uuid references public.user_profiles(id) on delete set null;
alter table public.user_profiles add column if not exists branch_name text;
alter table public.user_profiles add column if not exists provider_slug text;

update public.user_profiles
set referral_code = coalesce(referral_code, substr(replace(id::text, '-', ''), 1, 10))
where referral_code is null;

update public.user_profiles
set provider_slug = lower(regexp_replace(coalesce(home_name, business_name, full_name, id::text), '[^a-z0-9]+', '-', 'g'))
where provider_slug is null;

create unique index if not exists user_profiles_referral_code_unique_idx on public.user_profiles(referral_code) where referral_code is not null;
create index if not exists user_profiles_provider_slug_idx on public.user_profiles(provider_slug) where role in ('operations','marketplace');
create index if not exists user_profiles_branch_of_idx on public.user_profiles(branch_of);

alter table public.referrals enable row level security;

drop policy if exists "Admins can read referrals" on public.referrals;
create policy "Admins can read referrals" on public.referrals for select to authenticated using (public.current_user_is_admin());

drop policy if exists "Service role can manage referrals" on public.referrals;
create policy "Service role can manage referrals" on public.referrals for all to service_role using (true) with check (true);

grant select on public.referrals to authenticated;
grant all on public.referrals to service_role;

create or replace function public.set_user_referral_code()
returns trigger
language plpgsql
as $$
begin
  if new.referral_code is null then
    new.referral_code := substr(replace(new.id::text, '-', ''), 1, 10);
  end if;
  if new.provider_slug is null and new.role in ('operations','marketplace') then
    new.provider_slug := lower(regexp_replace(coalesce(new.home_name, new.business_name, new.full_name, new.id::text), '[^a-z0-9]+', '-', 'g'));
  end if;
  return new;
end;
$$;

drop trigger if exists trg_set_user_referral_code on public.user_profiles;
create trigger trg_set_user_referral_code
before insert or update on public.user_profiles
for each row execute function public.set_user_referral_code();
