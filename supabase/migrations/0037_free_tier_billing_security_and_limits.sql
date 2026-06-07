-- Free tier + paid tier enforcement and secure payment method storage.
-- Free providers keep billing setup, but no trial clock is used.
-- Free limit: max 5 active incoming service requests per provider until one is completed/cancelled/rejected/archived.

alter table public.user_profiles
  add column if not exists plan_code text not null default 'free',
  add column if not exists plan_status text not null default 'free',
  add column if not exists billing_required boolean not null default true,
  add column if not exists billing_setup_complete boolean not null default false,
  add column if not exists verified_badge boolean not null default false,
  add column if not exists featured_listing boolean not null default false,
  add column if not exists request_limit integer not null default 5,
  add column if not exists is_pro boolean not null default false;

update public.user_profiles
set plan_code = case when coalesce(is_pro, false) = true then 'pro' else 'free' end,
    plan_status = case when coalesce(is_pro, false) = true then 'paid' else 'free' end,
    request_limit = case when coalesce(is_pro, false) = true then 999999 else 5 end,
    billing_required = true
where role in ('operations', 'marketplace', 'Manager', 'Owner / Manager');

update public.subscriptions
set status = 'free',
    plan_name = 'free',
    payment_status = 'unpaid',
    trial_ends_at = null,
    trial_started_at = null,
    is_trial = false,
    updated_at = now()
where status in ('trialing', 'expired') and coalesce(payment_status, 'unpaid') <> 'paid';

create table if not exists public.payment_methods (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.user_profiles(id) on delete cascade,
  provider text not null check (provider in ('stripe', 'paypal')),
  provider_customer_id text,
  provider_method_id text not null,
  provider_setup_id text,
  card_brand text,
  card_last4 text,
  card_country text,
  card_fingerprint_hash text,
  paypal_payer_email text,
  paypal_agreement_id text,
  is_verified boolean not null default false,
  verification_status text not null default 'pending',
  verification_error text,
  is_default boolean not null default false,
  metadata jsonb not null default '{}'::jsonb,
  verified_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(provider, provider_method_id)
);

create table if not exists public.payment_verifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.user_profiles(id) on delete cascade,
  verification_type text not null,
  provider text not null,
  provider_verification_id text not null unique,
  status text not null default 'pending',
  error text,
  metadata jsonb not null default '{}'::jsonb,
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.stripe_customers (
  user_id uuid primary key references public.user_profiles(id) on delete cascade,
  stripe_customer_id text not null unique,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists payment_methods_user_idx on public.payment_methods(user_id, provider, is_verified);
create index if not exists payment_verifications_user_idx on public.payment_verifications(user_id, provider, status);
create index if not exists service_requests_provider_active_idx on public.service_requests(provider_id, status);

alter table public.payment_methods enable row level security;
alter table public.payment_verifications enable row level security;
alter table public.stripe_customers enable row level security;

drop policy if exists "Users read own payment methods" on public.payment_methods;
create policy "Users read own payment methods" on public.payment_methods for select to authenticated
  using (user_id = auth.uid() or exists(select 1 from public.user_profiles up where up.id = auth.uid() and up.role = 'admin'));

drop policy if exists "Users read own payment verifications" on public.payment_verifications;
create policy "Users read own payment verifications" on public.payment_verifications for select to authenticated
  using (user_id = auth.uid() or exists(select 1 from public.user_profiles up where up.id = auth.uid() and up.role = 'admin'));

drop policy if exists "Users read own stripe customer" on public.stripe_customers;
create policy "Users read own stripe customer" on public.stripe_customers for select to authenticated
  using (user_id = auth.uid() or exists(select 1 from public.user_profiles up where up.id = auth.uid() and up.role = 'admin'));

grant select, insert, update, delete on public.payment_methods to authenticated, service_role;
grant select, insert, update, delete on public.payment_verifications to authenticated, service_role;
grant select, insert, update, delete on public.stripe_customers to authenticated, service_role;

create or replace function public.is_provider_paid(provider_user_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.user_profiles up
    where up.id = provider_user_id
      and (coalesce(up.is_pro, false) = true or up.plan_code in ('pro','paid','enterprise') or up.plan_status in ('paid','active'))
  );
$$;

grant execute on function public.is_provider_paid(uuid) to anon, authenticated, service_role;

create or replace function public.get_provider_active_request_count(provider_user_id uuid)
returns integer
language sql
stable
security definer
set search_path = public
as $$
  select count(*)::integer
  from public.service_requests sr
  where sr.provider_id = provider_user_id
    and coalesce(sr.status, 'pending') not in ('completed','cancelled','rejected','archived','deleted','paid_done');
$$;

grant execute on function public.get_provider_active_request_count(uuid) to authenticated, service_role;

create or replace function public.enforce_provider_free_request_limit()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  provider_profile public.user_profiles%rowtype;
  active_count integer;
  max_requests integer;
begin
  if new.provider_id is null then return new; end if;
  select * into provider_profile from public.user_profiles where id = new.provider_id;
  if not found then return new; end if;
  if coalesce(provider_profile.is_pro, false) = true or provider_profile.plan_code in ('pro','paid','enterprise') or provider_profile.plan_status in ('paid','active') then
    return new;
  end if;
  max_requests := coalesce(provider_profile.request_limit, 5);
  select public.get_provider_active_request_count(new.provider_id) into active_count;
  if tg_op = 'INSERT' and active_count >= max_requests then
    raise exception 'Free tier providers can only have % active service requests at once. Complete, reject, cancel, or archive one request before accepting another.', max_requests;
  end if;
  return new;
end;
$$;

drop trigger if exists trg_service_requests_free_limit on public.service_requests;
create trigger trg_service_requests_free_limit
before insert on public.service_requests
for each row execute function public.enforce_provider_free_request_limit();

create or replace function public.admin_set_user_plan(target_user_id uuid, new_plan_code text, admin_user_id uuid default null, duration_days integer default 30, duration_hours integer default 6)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  actor uuid := coalesce(admin_user_id, auth.uid());
  is_paid boolean := lower(coalesce(new_plan_code, 'free')) in ('pro','paid','enterprise');
  expires_at timestamptz := case when is_paid then now() + make_interval(days => coalesce(duration_days,30), hours => coalesce(duration_hours,6)) else null end;
begin
  if not exists(select 1 from public.user_profiles where id = actor and role = 'admin') then
    raise exception 'Admin access required';
  end if;

  update public.user_profiles
  set plan_code = case when is_paid then 'pro' else 'free' end,
      plan_status = case when is_paid then 'paid' else 'free' end,
      is_pro = is_paid,
      request_limit = case when is_paid then 999999 else 5 end,
      verified_badge = case when is_paid then verified_badge else false end,
      featured_listing = case when is_paid then featured_listing else false end,
      updated_at = now()
  where id = target_user_id;

  insert into public.subscriptions (user_id, home_id, provider_id, plan_name, status, payment_status, started_at, expires_at, is_trial, trial_used, updated_at)
  values (target_user_id, target_user_id, target_user_id, case when is_paid then 'pro' else 'free' end, case when is_paid then 'active' else 'free' end, case when is_paid then 'paid' else 'unpaid' end, case when is_paid then now() else null end, expires_at, false, true, now())
  on conflict do nothing;

  insert into public.admin_logs(action, target_user_id, details, performed_by)
  values ('admin_set_user_plan', target_user_id, jsonb_build_object('plan', new_plan_code, 'expires_at', expires_at), actor)
  on conflict do nothing;
end;
$$;

grant execute on function public.admin_set_user_plan(uuid, text, uuid, integer, integer) to authenticated, service_role;

create or replace function public.expire_due_user_plans()
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  expired_count integer;
begin
  update public.user_profiles up
  set plan_code = 'free', plan_status = 'free', is_pro = false, request_limit = 5, verified_badge = false, featured_listing = false, updated_at = now()
  where exists (
    select 1 from public.subscriptions s
    where (s.user_id = up.id or s.home_id = up.id or s.provider_id = up.id)
      and s.status = 'active'
      and s.payment_status = 'paid'
      and s.expires_at is not null
      and s.expires_at <= now()
  );
  get diagnostics expired_count = row_count;
  update public.subscriptions set status = 'expired', payment_status = 'unpaid', updated_at = now()
  where status = 'active' and payment_status = 'paid' and expires_at is not null and expires_at <= now();
  return expired_count;
end;
$$;

grant execute on function public.expire_due_user_plans() to authenticated, service_role;
notify pgrst, 'reload schema';
