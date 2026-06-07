-- Fix admin_set_user_plan function with correct parameter order and grants
-- This migration ensures the function is properly accessible via RPC calls

drop function if exists public.admin_set_user_plan(uuid, text, uuid, integer, integer);

create or replace function public.admin_set_user_plan(
  target_user_id uuid,
  new_plan_code text default 'free',
  admin_user_id uuid default auth.uid(),
  duration_days integer default 30,
  duration_hours integer default 6
)
returns jsonb
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

  return jsonb_build_object(
    'success', true,
    'plan_code', new_plan_code,
    'user_id', target_user_id,
    'is_pro', new_plan_code != 'free',
    'plan_expires_at', case when new_plan_code = 'free' then null else (now() + make_interval(days => coalesce(duration_days, 30), hours => coalesce(duration_hours, 6)))::text end
  );
end;
$$;

grant execute on function public.admin_set_user_plan(uuid, text, uuid, integer, integer) to authenticated, service_role;

-- Add trigger to broadcast plan changes to subscribed clients
create or replace function public.broadcast_plan_change()
returns trigger
language plpgsql
as $$
begin
  perform
    pg_notify(
      'plan_changes',
      json_build_object(
        'user_id', new.id,
        'is_pro', new.is_pro,
        'plan_code', new.plan_code,
        'plan_expires_at', new.plan_expires_at
      )::text
    );
  return new;
end;
$$;

drop trigger if exists user_profiles_plan_change on public.user_profiles;

create trigger user_profiles_plan_change
  after update of is_pro, plan_code, plan_expires_at on public.user_profiles
  for each row
  execute function public.broadcast_plan_change();
