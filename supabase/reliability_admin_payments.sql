-- Struta reliability, payments, plans, push, bans, and account lifecycle support.
-- Run this once in Supabase SQL Editor, or through your migration runner.

create extension if not exists pgcrypto;

-- Webhook event audit/idempotency tables
create table if not exists public.paypal_webhook_events (
  id uuid primary key default gen_random_uuid(),
  paypal_event_id text not null unique,
  transmission_id text,
  event_type text,
  resource_id text,
  status text not null default 'received' check (status in ('received', 'processing', 'processed', 'failed', 'ignored')),
  raw_event jsonb not null,
  created_time timestamptz,
  processed_at timestamptz,
  processing_error text,
  inserted_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_paypal_webhook_events_event_type on public.paypal_webhook_events(event_type);
create index if not exists idx_paypal_webhook_events_resource_id on public.paypal_webhook_events(resource_id);
create index if not exists idx_paypal_webhook_events_status on public.paypal_webhook_events(status);

create table if not exists public.stripe_webhook_events (
  id uuid primary key default gen_random_uuid(),
  stripe_event_id text not null unique,
  event_type text,
  resource_id text,
  status text not null default 'received' check (status in ('received', 'processing', 'processed', 'failed', 'ignored')),
  raw_event jsonb not null,
  created_time timestamptz,
  processed_at timestamptz,
  processing_error text,
  inserted_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_stripe_webhook_events_event_type on public.stripe_webhook_events(event_type);
create index if not exists idx_stripe_webhook_events_resource_id on public.stripe_webhook_events(resource_id);
create index if not exists idx_stripe_webhook_events_status on public.stripe_webhook_events(status);

-- Push subscriptions
create table if not exists public.push_subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  role text,
  endpoint text not null unique,
  p256dh text not null,
  auth text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_push_subscriptions_user_id on public.push_subscriptions(user_id);

-- Billing plans and subscriptions support
create table if not exists public.billing_plans (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  name text not null,
  description text,
  amount numeric(12,2) not null default 0,
  currency text not null default 'KES',
  interval text not null default 'month',
  duration_days integer,
  duration_hours integer default 0,
  provider text,
  provider_plan_id text,
  active boolean not null default true,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

insert into public.billing_plans (code, name, description, amount, currency, interval, duration_days, duration_hours, active)
values
  ('free', 'Free Plan', 'Default free account access.', 0, 'KES', 'none', null, 0, true),
  ('pro_30d6h', 'Pro Plan', 'Admin-granted Pro access for 30 days and 6 hours.', 0, 'KES', 'manual', 30, 6, true)
on conflict (code) do update set
  name = excluded.name,
  description = excluded.description,
  duration_days = excluded.duration_days,
  duration_hours = excluded.duration_hours,
  active = excluded.active,
  updated_at = now();

create table if not exists public.subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid,
  home_id uuid,
  provider_id uuid,
  plan_name text not null default 'Free Plan',
  plan_code text not null default 'free',
  amount numeric(12,2) not null default 0,
  currency text not null default 'KES',
  status text not null default 'free',
  payment_provider text,
  payment_status text not null default 'free',
  started_at timestamptz,
  expires_at timestamptz,
  auto_revert_to_free boolean not null default true,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_subscriptions_user_id on public.subscriptions(user_id);
create index if not exists idx_subscriptions_home_id on public.subscriptions(home_id);
create index if not exists idx_subscriptions_provider_id on public.subscriptions(provider_id);
create index if not exists idx_subscriptions_status_expires on public.subscriptions(status, expires_at);

-- Payments/invoices/activity/notifications compatibility columns. These alter safely if tables already exist.
do $$
begin
  if to_regclass('public.payments') is null then
    create table public.payments (
      id uuid primary key default gen_random_uuid(),
      user_id uuid,
      provider_id uuid,
      provider_type text,
      request_id uuid,
      invoice_id uuid,
      subscription_id uuid,
      payer_email text,
      provider text,
      amount numeric(12,2),
      payment_method text,
      amount_expected numeric(12,2),
      amount_submitted numeric(12,2),
      currency text,
      status text not null default 'pending',
      reference text,
      paypal_order_id text,
      paypal_capture_id text,
      payment_gateway_reference text,
      transaction_code text,
      receipt_url text,
      submitted_at timestamptz default now(),
      metadata jsonb not null default '{}'::jsonb,
      raw_gateway_payload jsonb,
      created_at timestamptz not null default now(),
      updated_at timestamptz not null default now()
    );
  end if;
end $$;

alter table public.payments add column if not exists subscription_id uuid;
alter table public.payments add column if not exists provider text;
alter table public.payments add column if not exists paypal_order_id text;
alter table public.payments add column if not exists paypal_capture_id text;
alter table public.payments add column if not exists payment_gateway_reference text;
alter table public.payments add column if not exists raw_gateway_payload jsonb;
alter table public.payments add column if not exists metadata jsonb not null default '{}'::jsonb;
alter table public.payments add column if not exists updated_at timestamptz not null default now();
create index if not exists idx_payments_gateway_reference on public.payments(payment_gateway_reference);
create index if not exists idx_payments_paypal_order_id on public.payments(paypal_order_id);
create index if not exists idx_payments_subscription_id on public.payments(subscription_id);

create table if not exists public.invoices (
  id uuid primary key default gen_random_uuid(),
  user_id uuid,
  provider_id uuid,
  request_id uuid,
  payment_id uuid,
  status text not null default 'draft',
  amount numeric(12,2),
  currency text default 'KES',
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists idx_invoices_payment_id on public.invoices(payment_id);
create index if not exists idx_invoices_request_id on public.invoices(request_id);

create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  type text not null default 'general',
  title text not null,
  body text,
  entity_type text,
  entity_id uuid,
  deep_link text,
  idempotency_key text unique,
  read_at timestamptz,
  created_at timestamptz not null default now()
);
create index if not exists idx_notifications_user_id on public.notifications(user_id);

create table if not exists public.activity_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid,
  entity_type text,
  entity_id uuid,
  action text not null,
  details jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);
create index if not exists idx_activity_logs_user_id on public.activity_logs(user_id);
create index if not exists idx_activity_logs_entity on public.activity_logs(entity_type, entity_id);

-- Account bans, flags, and admin lifecycle.
create table if not exists public.account_bans (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  banned_by uuid,
  reason text not null default 'No reason provided.',
  violation_type text default 'terms_violation',
  starts_at timestamptz not null default now(),
  expires_at timestamptz,
  is_permanent boolean not null default false,
  active boolean not null default true,
  appeal_contact text default 'Contact Struta support to appeal this decision.',
  created_at timestamptz not null default now(),
  lifted_at timestamptz,
  lifted_by uuid,
  lift_reason text
);
create index if not exists idx_account_bans_user_active on public.account_bans(user_id, active);

create table if not exists public.account_violation_flags (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  reason text not null,
  violation_type text default 'terms_violation',
  source text default 'system',
  created_at timestamptz not null default now()
);
create index if not exists idx_account_violation_flags_user on public.account_violation_flags(user_id);

alter table public.user_profiles add column if not exists is_banned boolean not null default false;
alter table public.user_profiles add column if not exists ban_reason text;
alter table public.user_profiles add column if not exists banned_until timestamptz;
alter table public.user_profiles add column if not exists banned_at timestamptz;
alter table public.user_profiles add column if not exists ban_count integer not null default 0;
alter table public.user_profiles add column if not exists account_flagged boolean not null default false;
alter table public.user_profiles add column if not exists plan_code text not null default 'free';
alter table public.user_profiles add column if not exists plan_status text not null default 'free';
alter table public.user_profiles add column if not exists plan_expires_at timestamptz;
alter table public.user_profiles add column if not exists is_pro boolean not null default false;

-- Admin plan change: grants paid/pro for 30 days + 6 hours by default, or reverts to free.
create or replace function public.admin_set_user_plan(
  target_user_id uuid,
  new_plan_code text default 'free',
  admin_user_id uuid default auth.uid(),
  duration_days integer default 30,
  duration_hours integer default 6
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  expiry timestamptz;
  target_role text;
begin
  if target_user_id is null then
    raise exception 'target_user_id is required';
  end if;

  if coalesce(new_plan_code, 'free') = 'free' then
    update public.user_profiles
    set plan_code = 'free', plan_status = 'free', plan_expires_at = null, is_pro = false, updated_at = now()
    where id = target_user_id;

    insert into public.subscriptions (user_id, plan_name, plan_code, status, payment_status, started_at, expires_at, auto_revert_to_free, metadata)
    values (target_user_id, 'Free Plan', 'free', 'free', 'free', now(), null, false, jsonb_build_object('changed_by', admin_user_id));
  else
    expiry := now() + make_interval(days => coalesce(duration_days, 30), hours => coalesce(duration_hours, 6));

    update public.user_profiles
    set plan_code = new_plan_code, plan_status = 'paid', plan_expires_at = expiry, is_pro = true, updated_at = now()
    where id = target_user_id;

    select role into target_role from public.user_profiles where id = target_user_id;

    insert into public.subscriptions (user_id, home_id, provider_id, plan_name, plan_code, status, payment_status, started_at, expires_at, auto_revert_to_free, metadata)
    values (
      target_user_id,
      case when target_role = 'operations' then target_user_id else null end,
      case when target_role = 'marketplace' then target_user_id else null end,
      'Pro Plan',
      new_plan_code,
      'active',
      'paid',
      now(),
      expiry,
      true,
      jsonb_build_object('changed_by', admin_user_id, 'duration_days', duration_days, 'duration_hours', duration_hours)
    );
  end if;

  insert into public.activity_logs (user_id, entity_type, entity_id, action, details)
  values (admin_user_id, 'user_profile', target_user_id, 'admin.plan.changed', jsonb_build_object('plan_code', new_plan_code));
end;
$$;

-- Call this from a scheduled job/cron to auto-revert expired paid plans.
create or replace function public.expire_due_user_plans()
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  changed_count integer;
begin
  update public.user_profiles
  set plan_code = 'free', plan_status = 'free', plan_expires_at = null, is_pro = false, updated_at = now()
  where is_pro = true and plan_expires_at is not null and plan_expires_at <= now();
  get diagnostics changed_count = row_count;

  update public.subscriptions
  set status = 'expired', payment_status = 'expired', updated_at = now()
  where auto_revert_to_free = true and status = 'active' and expires_at is not null and expires_at <= now();

  return changed_count;
end;
$$;

-- Ban without reason: select ban_user('uuid');
create or replace function public.ban_user(
  target_user_id uuid,
  ban_reason text default 'No reason provided.',
  ban_duration interval default null,
  admin_user_id uuid default auth.uid(),
  violation_type text default 'terms_violation'
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  final_expires_at timestamptz;
  final_permanent boolean;
  new_ban_count integer;
begin
  if target_user_id is null then
    raise exception 'target_user_id is required';
  end if;

  if ban_duration is null then
    final_expires_at := null;
    final_permanent := true;
  else
    if ban_duration < interval '14 days' then
      raise exception 'Temporary bans must be at least 14 days.';
    end if;
    final_expires_at := now() + ban_duration;
    final_permanent := false;
  end if;

  insert into public.account_bans (user_id, banned_by, reason, violation_type, expires_at, is_permanent, active)
  values (target_user_id, admin_user_id, coalesce(nullif(ban_reason, ''), 'No reason provided.'), violation_type, final_expires_at, final_permanent, true);

  update public.user_profiles
  set is_banned = true,
      ban_reason = coalesce(nullif(ban_reason, ''), 'No reason provided.'),
      banned_until = final_expires_at,
      banned_at = now(),
      ban_count = coalesce(ban_count, 0) + 1,
      updated_at = now()
  where id = target_user_id
  returning ban_count into new_ban_count;

  if coalesce(new_ban_count, 0) > 2 then
    update public.user_profiles set account_flagged = true where id = target_user_id;
  end if;

  insert into public.notifications (user_id, type, title, body, entity_type, entity_id, deep_link, idempotency_key)
  values (
    target_user_id,
    'account.banned',
    'Account banned',
    coalesce(nullif(ban_reason, ''), 'No reason provided.'),
    'account_ban',
    null,
    '/account-banned',
    'ban:' || target_user_id::text || ':' || extract(epoch from now())::text
  );
end;
$$;

create or replace function public.record_terms_violation(
  target_user_id uuid,
  violation_reason text,
  violation_type text default 'terms_violation'
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  recent_count integer;
begin
  insert into public.account_violation_flags (user_id, reason, violation_type, source)
  values (target_user_id, violation_reason, violation_type, 'system');

  select count(*) into recent_count
  from public.account_violation_flags
  where user_id = target_user_id
    and created_at >= now() - interval '90 days';

  if recent_count > 2 then
    update public.user_profiles set account_flagged = true where id = target_user_id;
  else
    perform public.ban_user(target_user_id, violation_reason, interval '5 days', null, violation_type);
  end if;
end;
$$;

create or replace function public.unban_user(
  target_user_id uuid,
  admin_user_id uuid default auth.uid(),
  unban_reason text default 'Unbanned by admin.'
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.account_bans
  set active = false, lifted_at = now(), lifted_by = admin_user_id, lift_reason = unban_reason
  where user_id = target_user_id and active = true;

  update public.user_profiles
  set is_banned = false, ban_reason = null, banned_until = null, updated_at = now()
  where id = target_user_id;

  insert into public.activity_logs (user_id, entity_type, entity_id, action, details)
  values (admin_user_id, 'user_profile', target_user_id, 'admin.user.unbanned', jsonb_build_object('reason', unban_reason));
end;
$$;

-- Admin deletes specified user, or user deletes own account when no argument is passed.
create or replace function public.delete_account(target_user_id uuid default auth.uid())
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  actor uuid := auth.uid();
begin
  if target_user_id is null then
    raise exception 'No user id provided and no authenticated user found.';
  end if;

  if actor is not null and actor <> target_user_id then
    if not exists (select 1 from public.user_profiles where id = actor and role = 'admin') then
      raise exception 'Only admins can delete another user account.';
    end if;
  end if;

  delete from public.push_subscriptions where user_id = target_user_id;
  delete from public.notifications where user_id = target_user_id;
  delete from public.account_bans where user_id = target_user_id;
  delete from public.account_violation_flags where user_id = target_user_id;
  delete from public.payments where user_id = target_user_id or provider_id = target_user_id;
  delete from public.invoices where user_id = target_user_id or provider_id = target_user_id;
  delete from public.subscriptions where user_id = target_user_id or home_id = target_user_id or provider_id = target_user_id;
  delete from public.service_requests where requester_id = target_user_id or provider_id = target_user_id;
  delete from public.memorial_pages where user_id = target_user_id;
  delete from public.user_profiles where id = target_user_id;
end;
$$;

grant execute on function public.admin_set_user_plan(uuid, text, uuid, integer, integer) to authenticated, service_role;
grant execute on function public.expire_due_user_plans() to authenticated, service_role;
grant execute on function public.ban_user(uuid, text, interval, uuid, text) to authenticated, service_role;
grant execute on function public.unban_user(uuid, uuid, text) to authenticated, service_role;
grant execute on function public.delete_account(uuid) to authenticated, service_role;
grant execute on function public.record_terms_violation(uuid, text, text) to authenticated, service_role;
