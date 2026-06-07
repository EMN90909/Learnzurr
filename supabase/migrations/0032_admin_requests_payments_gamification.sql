create extension if not exists pgcrypto;

alter table public.payments add column if not exists amount_expected numeric(12,2);
alter table public.payments add column if not exists amount_submitted numeric(12,2);
alter table public.payments add column if not exists transaction_code text;
alter table public.payments add column if not exists payment_name text;
alter table public.payments add column if not exists recipient_name text;
alter table public.payments add column if not exists recipient_phone_or_till text;
alter table public.payments add column if not exists receipt_url text;
alter table public.payments add column if not exists submitted_at timestamptz;
alter table public.payments add column if not exists verified_by uuid references auth.users(id) on delete set null;
alter table public.payments add column if not exists verified_at timestamptz;
alter table public.payments add column if not exists rejected_at timestamptz;
alter table public.payments add column if not exists rejection_reason text;
alter table public.payments add column if not exists risk_flags jsonb not null default '{}'::jsonb;

create or replace function public.current_user_is_admin()
returns boolean
language sql
security definer
stable
as $$
  select exists (
    select 1
    from public.user_profiles
    where id = auth.uid()
    and role = 'admin'
  );
$$;

create or replace function public.delete_request(request_id_input uuid)
returns void
language plpgsql
security definer
as $$
begin
  if not public.current_user_is_admin() then
    raise exception 'Only admins can delete requests';
  end if;

  delete from public.payments where request_id = request_id_input;
  delete from public.invoices where request_id = request_id_input;
  delete from public.service_requests where id = request_id_input;
end;
$$;

grant execute on function public.delete_request(uuid) to authenticated;

create or replace function public.admin_delete_user(target_user_id uuid)
returns void
language plpgsql
security definer
as $$
declare
  current_user_id uuid := auth.uid();
begin
  if not public.current_user_is_admin() then
    raise exception 'Only admins can delete users';
  end if;

  if target_user_id = current_user_id then
    raise exception 'You cannot delete your own account from admin controls';
  end if;

  insert into public.admin_logs (
    action,
    target_user_id,
    details,
    performed_by
  )
  values (
    'account_delete',
    target_user_id,
    jsonb_build_object('deleted_by', 'admin'),
    current_user_id
  );

  update public.user_profiles
  set
    deleted_at = now(),
    active = false,
    is_banned = true,
    updated_at = now()
  where id = target_user_id;

  delete from public.notifications where user_id = target_user_id;
  delete from public.subscriptions where user_id = target_user_id or home_id = target_user_id or provider_id = target_user_id;
  delete from public.push_subscriptions where user_id = target_user_id;

  begin
    delete from auth.users where id = target_user_id;
  exception
    when others then
      null;
  end;
end;
$$;

grant execute on function public.admin_delete_user(uuid) to authenticated;

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

grant execute on function public.admin_set_user_plan(uuid, text, uuid, integer, integer) to authenticated, service_role;

create or replace function public.admin_update_user_role(
  target_user_id uuid,
  target_role text
)
returns void
language plpgsql
security definer
as $$
begin
  if not public.current_user_is_admin() then
    raise exception 'Only admins can change user roles';
  end if;

  if target_role not in ('family', 'operations', 'marketplace', 'admin') then
    raise exception 'Invalid role';
  end if;

  update public.user_profiles
  set
    role = target_role,
    is_home = target_role = 'operations',
    is_vendor = target_role = 'marketplace',
    updated_at = now()
  where id = target_user_id;
end;
$$;

grant execute on function public.admin_update_user_role(uuid, text) to authenticated;

create or replace function public.create_notification(
  target_user_id uuid,
  notification_type text,
  notification_title text,
  notification_body text,
  notification_link text default null,
  notification_idempotency_key text default null
)
returns uuid
language plpgsql
security definer
as $$
declare
  inserted_id uuid;
begin
  if auth.uid() is null then
    raise exception 'You must be logged in to create notifications';
  end if;

  insert into public.notifications (
    user_id,
    type,
    title,
    body,
    entity_type,
    entity_id,
    deep_link,
    idempotency_key
  )
  values (
    target_user_id,
    notification_type,
    notification_title,
    notification_body,
    notification_type,
    null,
    notification_link,
    coalesce(notification_idempotency_key, gen_random_uuid()::text)
  )
  on conflict (idempotency_key) do update
    set title = excluded.title
  returning id into inserted_id;

  return inserted_id;
end;
$$;

grant execute on function public.create_notification(uuid, text, text, text, text, text) to authenticated;

create or replace function public.staff_join_by_code(
  staff_email_input text,
  general_code_input text
)
returns jsonb
language plpgsql
security definer
as $$
declare
  current_user_id uuid := auth.uid();
  normalized_email text := lower(trim(staff_email_input));
  staff_row public.erp_staff%rowtype;
  settings_row public.erp_organization_settings%rowtype;
begin
  if current_user_id is null then
    raise exception 'You must be signed in to join staff portal';
  end if;

  select *
  into staff_row
  from public.erp_staff
  where lower(email) = normalized_email
  order by created_at desc
  limit 1;

  if staff_row.id is null then
    raise exception 'Staff record not found. Ask your manager to add your email.';
  end if;

  select *
  into settings_row
  from public.erp_organization_settings
  where organization_id = staff_row.home_id;

  if settings_row.id is null or settings_row.general_code is null or settings_row.general_code <> general_code_input then
    raise exception 'Invalid staff code';
  end if;

  update public.erp_staff
  set
    user_id = current_user_id,
    is_active = true,
    last_login_at = now(),
    updated_at = now()
  where id = staff_row.id;

  update public.user_profiles
  set
    role = staff_row.role,
    staff_role = staff_row.role,
    staff_business_type = staff_row.organization_type,
    organization_id = staff_row.home_id,
    manager_id = staff_row.home_id,
    general_code = settings_row.general_code,
    active = true,
    updated_at = now()
  where id = current_user_id;

  return jsonb_build_object(
    'staffId', staff_row.id,
    'organizationId', staff_row.home_id,
    'organizationType', staff_row.organization_type,
    'role', staff_row.role
  );
end;
$$;

grant execute on function public.staff_join_by_code(text, text) to authenticated;

create table if not exists public.gamification_rules (
  id uuid primary key default gen_random_uuid(),
  code text unique not null,
  title text not null,
  description text not null,
  audience text not null check (audience in ('vendor', 'home', 'family', 'all')),
  reward_days int not null check (reward_days > 0),
  metric_key text not null,
  threshold_value int not null check (threshold_value > 0),
  is_enabled boolean not null default false,
  starts_at timestamptz,
  ends_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.gamification_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.user_profiles(id) on delete cascade,
  event_key text not null,
  event_value int not null default 1,
  metadata jsonb not null default '{}'::jsonb,
  occurred_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create table if not exists public.gamification_grants (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.user_profiles(id) on delete cascade,
  rule_id uuid not null references public.gamification_rules(id) on delete cascade,
  rule_code text not null,
  reward_days int not null check (reward_days > 0),
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  status text not null default 'active' check (status in ('pending', 'active', 'expired', 'revoked')),
  source_event_id uuid references public.gamification_events(id) on delete set null,
  reason text,
  granted_at timestamptz,
  activated_at timestamptz,
  expired_at timestamptz,
  revoked_at timestamptz,
  revoked_reason text,
  created_by uuid references public.user_profiles(id) on delete set null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.gamification_grant_ledger (
  id uuid primary key default gen_random_uuid(),
  grant_id uuid not null references public.gamification_grants(id) on delete cascade,
  user_id uuid not null references public.user_profiles(id) on delete cascade,
  action text not null,
  old_data jsonb not null default '{}'::jsonb,
  new_data jsonb not null default '{}'::jsonb,
  performed_by uuid references public.user_profiles(id) on delete set null,
  created_at timestamptz not null default now()
);

create table if not exists public.gamification_rule_audit (
  id uuid primary key default gen_random_uuid(),
  rule_id uuid not null references public.gamification_rules(id) on delete cascade,
  action text not null,
  old_data jsonb not null default '{}'::jsonb,
  new_data jsonb not null default '{}'::jsonb,
  changed_by uuid references public.user_profiles(id) on delete set null,
  created_at timestamptz not null default now()
);

create index if not exists gamification_events_user_key_idx on public.gamification_events(user_id, event_key, occurred_at desc);
create index if not exists gamification_grants_user_status_idx on public.gamification_grants(user_id, status, ends_at desc);

insert into public.gamification_rules (
  code,
  title,
  description,
  audience,
  reward_days,
  metric_key,
  threshold_value,
  is_enabled
)
values
  ('milestone_unlocks', 'Milestone Unlocks', 'Vendors who complete 50 bookings unlock 2 weeks of Pro Plan.', 'vendor', 14, 'completed_bookings', 50, false),
  ('streak_bonuses', 'Streak Bonuses', 'Maintain 30 days of active usage and earn 5 bonus days of Pro Plan.', 'vendor', 5, 'active_days', 30, false),
  ('leaderboard_incentives', 'Leaderboard Incentives', 'Top 5 vendors each month get Pro Plan extensions.', 'vendor', 7, 'monthly_leaderboard_rank', 5, false),
  ('seasonal_challenges', 'Seasonal Challenges', 'During festive seasons, complete set goals such as 20 bookings to earn Pro Plan time.', 'vendor', 7, 'seasonal_bookings', 20, false),
  ('vendor_growth_bonus', 'Vendor Growth Bonus', 'Vendors who onboard 5 new staff through the dashboard earn Pro Plan credits.', 'vendor', 7, 'staff_onboarded', 5, false),
  ('referral_rewards', 'Referral Rewards', 'Refer Struta to 10 families and earn 1 week of Pro Plan free.', 'all', 7, 'family_referrals', 10, false),
  ('family_loyalty', 'Family Loyalty', 'Families who use Struta for 3 or more events get a free Pro upgrade for their next booking.', 'family', 7, 'family_events', 3, false),
  ('feedback_rewards', 'Feedback Rewards', 'Submit verified feedback or feature requests and earn Pro Plan credits.', 'all', 3, 'verified_feedback', 1, false),
  ('community_builder', 'Community Builder', 'Vendors who invite 3 other vendors to join Struta unlock Pro Plan days.', 'vendor', 7, 'vendor_invites', 3, false)
on conflict (code) do update set
  title = excluded.title,
  description = excluded.description,
  audience = excluded.audience,
  reward_days = excluded.reward_days,
  metric_key = excluded.metric_key,
  threshold_value = excluded.threshold_value,
  is_enabled = false,
  updated_at = now();

create or replace function public.update_gamification_rule_status(
  target_rule_code text,
  enabled boolean,
  campaign_starts_at timestamptz default null,
  campaign_ends_at timestamptz default null
)
returns void
language plpgsql
security definer
as $$
declare
  current_user_id uuid := auth.uid();
  target_rule public.gamification_rules%rowtype;
  updated_rule public.gamification_rules%rowtype;
begin
  if not public.current_user_is_admin() then
    raise exception 'Only admins can update gamification rules';
  end if;

  select *
  into target_rule
  from public.gamification_rules
  where code = target_rule_code;

  if target_rule.id is null then
    raise exception 'Gamification rule not found';
  end if;

  update public.gamification_rules
  set
    is_enabled = enabled,
    starts_at = campaign_starts_at,
    ends_at = campaign_ends_at,
    updated_at = now()
  where code = target_rule_code
  returning * into updated_rule;

  insert into public.gamification_rule_audit (
    rule_id,
    action,
    old_data,
    new_data,
    changed_by
  )
  values (
    target_rule.id,
    case when enabled then 'enabled' else 'disabled' end,
    to_jsonb(target_rule),
    to_jsonb(updated_rule),
    current_user_id
  );
end;
$$;

grant execute on function public.update_gamification_rule_status(text, boolean, timestamptz, timestamptz) to authenticated;

create or replace function public.grant_gamification_pro_days(
  target_user_id uuid,
  target_rule_id uuid,
  source_event_id_input uuid default null,
  reason_input text default null
)
returns uuid
language plpgsql
security definer
as $$
declare
  reward_rule public.gamification_rules%rowtype;
  new_grant_id uuid;
  grant_start timestamptz := now();
  grant_end timestamptz;
  current_profile public.user_profiles%rowtype;
begin
  select *
  into reward_rule
  from public.gamification_rules
  where id = target_rule_id;

  if reward_rule.id is null then
    raise exception 'Gamification rule not found';
  end if;

  select *
  into current_profile
  from public.user_profiles
  where id = target_user_id;

  if current_profile.id is null then
    raise exception 'User not found';
  end if;

  grant_end := grant_start + (reward_rule.reward_days || ' days')::interval;

  insert into public.gamification_grants (
    user_id,
    rule_id,
    rule_code,
    reward_days,
    starts_at,
    ends_at,
    status,
    source_event_id,
    reason,
    granted_at,
    activated_at,
    created_by
  )
  values (
    target_user_id,
    reward_rule.id,
    reward_rule.code,
    reward_rule.reward_days,
    grant_start,
    grant_end,
    'active',
    source_event_id_input,
    reason_input,
    now(),
    now(),
    auth.uid()
  )
  returning id into new_grant_id;

  insert into public.gamification_grant_ledger (
    grant_id,
    user_id,
    action,
    new_data,
    performed_by
  )
  select
    id,
    user_id,
    'grant_created',
    to_jsonb(public.gamification_grants),
    auth.uid()
  from public.gamification_grants
  where id = new_grant_id;

  update public.subscriptions
  set
    plan_name = case when current_profile.role = 'family' then 'Struta Memorial Pro' else 'Struta Professional' end,
    status = 'active',
    payment_status = 'paid',
    started_at = coalesce(started_at, now()),
    expires_at = greatest(coalesce(expires_at, now()), now()) + (reward_rule.reward_days || ' days')::interval,
    current_period_start = now(),
    current_period_end = greatest(coalesce(expires_at, now()), now()) + (reward_rule.reward_days || ' days')::interval,
    updated_at = now()
  where user_id = target_user_id;

  if not found then
    insert into public.subscriptions (
      user_id,
      home_id,
      provider_id,
      plan_name,
      status,
      payment_status,
      started_at,
      expires_at,
      current_period_start,
      current_period_end,
      created_at,
      updated_at
    )
    values (
      target_user_id,
      target_user_id,
      case when current_profile.role = 'marketplace' then target_user_id else null end,
      case when current_profile.role = 'family' then 'Struta Memorial Pro' else 'Struta Professional' end,
      'active',
      'paid',
      now(),
      grant_end,
      now(),
      grant_end,
      now(),
      now()
    );
  end if;

  return new_grant_id;
end;
$$;

grant execute on function public.grant_gamification_pro_days(uuid, uuid, uuid, text) to authenticated;

create or replace function public.evaluate_gamification_rewards(
  target_user_id uuid,
  event_key_input text,
  source_event_id_input uuid
)
returns void
language plpgsql
security definer
as $$
declare
  reward_rule record;
  total_metric_value int;
  user_role text;
begin
  select role into user_role from public.user_profiles where id = target_user_id;

  for reward_rule in
    select *
    from public.gamification_rules
    where is_enabled = true
      and metric_key = event_key_input
      and (starts_at is null or starts_at <= now())
      and (ends_at is null or ends_at >= now())
      and (
        audience = 'all'
        or (audience = 'family' and user_role = 'family')
        or (audience = 'home' and user_role = 'operations')
        or (audience = 'vendor' and user_role in ('operations', 'marketplace'))
      )
  loop
    select coalesce(sum(event_value), 0)
    into total_metric_value
    from public.gamification_events
    where user_id = target_user_id
      and event_key = reward_rule.metric_key;

    if total_metric_value >= reward_rule.threshold_value then
      if not exists (
        select 1
        from public.gamification_grants
        where user_id = target_user_id
          and rule_id = reward_rule.id
          and status in ('pending', 'active')
      ) then
        perform public.grant_gamification_pro_days(
          target_user_id,
          reward_rule.id,
          source_event_id_input,
          reward_rule.description
        );
      end if;
    end if;
  end loop;
end;
$$;

grant execute on function public.evaluate_gamification_rewards(uuid, text, uuid) to authenticated;

create or replace function public.record_gamification_event(
  target_user_id uuid,
  event_key_input text,
  event_value_input int default 1,
  metadata_input jsonb default '{}'::jsonb
)
returns uuid
language plpgsql
security definer
as $$
declare
  created_event_id uuid;
begin
  insert into public.gamification_events (
    user_id,
    event_key,
    event_value,
    metadata
  )
  values (
    target_user_id,
    event_key_input,
    event_value_input,
    metadata_input
  )
  returning id into created_event_id;

  perform public.evaluate_gamification_rewards(
    target_user_id,
    event_key_input,
    created_event_id
  );

  return created_event_id;
end;
$$;

grant execute on function public.record_gamification_event(uuid, text, int, jsonb) to authenticated;

create or replace function public.expire_gamification_grants()
returns void
language plpgsql
security definer
as $$
declare
  expired_grant record;
begin
  for expired_grant in
    select *
    from public.gamification_grants
    where status = 'active'
      and ends_at <= now()
  loop
    update public.gamification_grants
    set
      status = 'expired',
      expired_at = now(),
      updated_at = now()
    where id = expired_grant.id;

    insert into public.gamification_grant_ledger (
      grant_id,
      user_id,
      action,
      old_data,
      new_data
    )
    values (
      expired_grant.id,
      expired_grant.user_id,
      'grant_expired',
      to_jsonb(expired_grant),
      jsonb_build_object('status', 'expired', 'expired_at', now())
    );
  end loop;

  update public.subscriptions
  set
    plan_name = 'free',
    status = 'inactive',
    payment_status = 'unpaid',
    updated_at = now()
  where status = 'active'
    and payment_status = 'paid'
    and expires_at is not null
    and expires_at <= now();
end;
$$;

grant execute on function public.expire_gamification_grants() to authenticated;

alter table public.gamification_rules enable row level security;
alter table public.gamification_events enable row level security;
alter table public.gamification_grants enable row level security;
alter table public.gamification_grant_ledger enable row level security;
alter table public.gamification_rule_audit enable row level security;

drop policy if exists "gamification rules select" on public.gamification_rules;
create policy "gamification rules select" on public.gamification_rules
  for select to authenticated using (true);

drop policy if exists "gamification events own select" on public.gamification_events;
create policy "gamification events own select" on public.gamification_events
  for select to authenticated using (user_id = auth.uid() or public.current_user_is_admin());

drop policy if exists "gamification grants own select" on public.gamification_grants;
create policy "gamification grants own select" on public.gamification_grants
  for select to authenticated using (user_id = auth.uid() or public.current_user_is_admin());

drop policy if exists "gamification grant ledger admin select" on public.gamification_grant_ledger;
create policy "gamification grant ledger admin select" on public.gamification_grant_ledger
  for select to authenticated using (public.current_user_is_admin());

drop policy if exists "gamification rule audit admin select" on public.gamification_rule_audit;
create policy "gamification rule audit admin select" on public.gamification_rule_audit
  for select to authenticated using (public.current_user_is_admin());
