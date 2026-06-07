-- Smart policy suspension system
-- A user can only be suspended through this function when a clear policy reason is provided.

alter table public.user_profiles
  add column if not exists is_banned boolean default false,
  add column if not exists ban_reason text,
  add column if not exists banned_until timestamptz,
  add column if not exists ban_count integer default 0,
  add column if not exists account_flagged boolean default false;

create table if not exists public.policy_violations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  admin_user_id uuid references auth.users(id) on delete set null,
  violation_type text not null default 'policy_review',
  reason text not null,
  action_taken text not null default 'temporary_suspend',
  duration_days integer,
  starts_at timestamptz not null default now(),
  ends_at timestamptz,
  resolved_at timestamptz,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

alter table public.policy_violations enable row level security;

drop policy if exists "Admins can read policy violations" on public.policy_violations;
create policy "Admins can read policy violations"
  on public.policy_violations
  for select
  using (
    exists (
      select 1 from public.admin_emails ae
      where lower(ae.email) = lower(auth.jwt() ->> 'email')
    )
  );

drop policy if exists "Admins can insert policy violations" on public.policy_violations;
create policy "Admins can insert policy violations"
  on public.policy_violations
  for insert
  with check (
    exists (
      select 1 from public.admin_emails ae
      where lower(ae.email) = lower(auth.jwt() ->> 'email')
    )
  );

create or replace function public.admin_apply_policy_suspension(
  target_user_id uuid,
  admin_user_id uuid,
  reason text,
  duration_days integer default 3,
  permanent boolean default false,
  violation_type text default 'policy_review'
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  current_ban_count integer := 0;
  new_ban_count integer := 0;
  suspend_until timestamptz := null;
  admin_email text;
begin
  select email into admin_email from public.user_profiles where id = admin_user_id;

  if not exists (select 1 from public.admin_emails ae where lower(ae.email) = lower(admin_email)) then
    raise exception 'Admin access required';
  end if;

  if target_user_id = admin_user_id then
    raise exception 'You cannot suspend your own admin account';
  end if;

  if reason is null or length(trim(reason)) < 8 then
    raise exception 'A clear policy reason is required before suspending an account';
  end if;

  if permanent is true then
    suspend_until := null;
  else
    duration_days := greatest(1, least(coalesce(duration_days, 3), 365));
    suspend_until := now() + make_interval(days => duration_days);
  end if;

  select coalesce(ban_count, 0) into current_ban_count
  from public.user_profiles
  where id = target_user_id;

  new_ban_count := current_ban_count + 1;

  insert into public.policy_violations (
    user_id,
    admin_user_id,
    violation_type,
    reason,
    action_taken,
    duration_days,
    starts_at,
    ends_at
  ) values (
    target_user_id,
    admin_user_id,
    coalesce(nullif(trim(violation_type), ''), 'policy_review'),
    trim(reason),
    case when permanent then 'permanent_suspend' else 'temporary_suspend' end,
    case when permanent then null else duration_days end,
    now(),
    suspend_until
  );

  update public.user_profiles
  set
    is_banned = true,
    active = false,
    ban_reason = trim(reason),
    banned_until = suspend_until,
    ban_count = new_ban_count,
    account_flagged = new_ban_count >= 3,
    updated_at = now()
  where id = target_user_id;

  return jsonb_build_object(
    'ok', true,
    'user_id', target_user_id,
    'duration_days', case when permanent then null else duration_days end,
    'banned_until', suspend_until,
    'ban_count', new_ban_count
  );
end;
$$;

create or replace function public.admin_remove_policy_suspension(
  target_user_id uuid,
  admin_user_id uuid,
  reason text default 'Suspension removed after admin review'
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  admin_email text;
begin
  select email into admin_email from public.user_profiles where id = admin_user_id;

  if not exists (select 1 from public.admin_emails ae where lower(ae.email) = lower(admin_email)) then
    raise exception 'Admin access required';
  end if;

  update public.policy_violations
  set resolved_at = now(),
      metadata = coalesce(metadata, '{}'::jsonb) || jsonb_build_object('resolution_reason', reason)
  where user_id = target_user_id
    and resolved_at is null;

  update public.user_profiles
  set
    is_banned = false,
    active = true,
    ban_reason = null,
    banned_until = null,
    updated_at = now()
  where id = target_user_id;

  return jsonb_build_object('ok', true, 'user_id', target_user_id);
end;
$$;

grant execute on function public.admin_apply_policy_suspension(uuid, uuid, text, integer, boolean, text) to authenticated;
grant execute on function public.admin_remove_policy_suspension(uuid, uuid, text) to authenticated;
