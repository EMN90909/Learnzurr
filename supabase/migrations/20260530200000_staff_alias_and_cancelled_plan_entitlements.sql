-- Fix staff-login compatibility and cancelled-plan entitlement handling.
-- Some deployed staff-login paths still reference public.staff. Struta's canonical
-- staff table is public.staff_members, so this view prevents "relation public.staff
-- does not exist" while older code is replaced.

alter table public.user_profiles add column if not exists plan_original_expires_at timestamptz;
alter table public.user_profiles add column if not exists plan_cancels_at_period_end boolean default false;

create or replace view public.staff as
select
  sm.id,
  sm.business_id,
  sm.business_type,
  sm.user_id,
  sm.staff_name,
  sm.normalized_staff_name,
  sm.task_description,
  sm.branch_id,
  sm.phone,
  sm.email,
  sm.status,
  sm.created_by,
  sm.created_at,
  sm.updated_at
from public.staff_members sm;

grant select on public.staff to anon, authenticated, service_role;

create or replace function public.staff_login_by_code(
  staff_name_input text,
  general_code_input text
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  staff_profile_row record;
  staff_member_row record;
  org_row record;
  business_row record;
  destination text;
  normalized_input text;
begin
  if trim(coalesce(staff_name_input, '')) = '' then
    raise exception 'Staff email or name is required';
  end if;

  if trim(coalesce(general_code_input, '')) = '' then
    raise exception 'Organisation code is required';
  end if;

  normalized_input := public.normalize_staff_name(staff_name_input);

  select * into org_row
  from public.erp_organization_settings
  where general_code = trim(general_code_input)
  limit 1;

  if org_row.organization_id is not null then
    select id, full_name, email, role, staff_role, staff_business_type, organization_id, manager_id, active
    into staff_profile_row
    from public.user_profiles
    where organization_id = org_row.organization_id
      and coalesce(active, true) = true
      and (
        lower(trim(coalesce(email, ''))) = lower(trim(staff_name_input))
        or public.normalize_staff_name(full_name) = normalized_input
      )
    limit 1;
  end if;

  if staff_profile_row.id is null then
    select * into business_row
    from public.businesses
    where trim(coalesce(staff_access_code, '')) = trim(general_code_input)
      and coalesce(staff_code_enabled, true) = true
      and coalesce(active, true) = true
    limit 1;

    if business_row.id is not null then
      select sm.* into staff_member_row
      from public.staff_members sm
      where sm.business_id = business_row.id
        and coalesce(sm.status, 'active') = 'active'
        and (
          lower(trim(coalesce(sm.email, ''))) = lower(trim(staff_name_input))
          or sm.normalized_staff_name = normalized_input
        )
      limit 1;
    end if;
  end if;

  if staff_profile_row.id is null and staff_member_row.id is null then
    raise exception 'Staff member not found for this code';
  end if;

  destination := case
    when coalesce(staff_profile_row.staff_business_type, org_row.organization_type, staff_member_row.business_type, business_row.business_type) in ('vendor', 'marketplace') then '/marketplace'
    else '/manager'
  end;

  return jsonb_build_object(
    'success', true,
    'staff_id', coalesce(staff_profile_row.id, staff_member_row.id),
    'staff_name', coalesce(staff_profile_row.full_name, staff_member_row.staff_name),
    'email', coalesce(staff_profile_row.email, staff_member_row.email),
    'role', coalesce(staff_profile_row.role, staff_profile_row.staff_role, 'staff'),
    'staff_role', coalesce(staff_profile_row.staff_role, 'staff'),
    'organization_id', staff_profile_row.organization_id,
    'manager_id', staff_profile_row.manager_id,
    'business_id', staff_member_row.business_id,
    'staff_business_type', coalesce(staff_profile_row.staff_business_type, org_row.organization_type, staff_member_row.business_type, business_row.business_type),
    'portal_path', destination
  );
end;
$$;

grant execute on function public.staff_login_by_code(text, text) to anon, authenticated, service_role;

create or replace function public.provider_feature_entitlements(provider_user_id uuid)
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  profile_row record;
  pro_enabled boolean;
  plan_status_value text;
begin
  select id, role, plan_code, plan_status, plan_expires_at, plan_original_expires_at, plan_cancels_at_period_end, is_pro
  into profile_row
  from public.user_profiles
  where id = provider_user_id;

  if profile_row.id is null then
    raise exception 'Provider not found';
  end if;

  plan_status_value := lower(coalesce(profile_row.plan_status, 'free'));
  pro_enabled := coalesce(profile_row.is_pro, false)
    or (
      coalesce(profile_row.plan_code, 'free') <> 'free'
      and (
        plan_status_value in ('paid', 'active', 'trialing')
        or (
          plan_status_value in ('cancelled', 'canceled')
          and coalesce(profile_row.plan_expires_at, profile_row.plan_original_expires_at) > now()
        )
      )
      and (
        coalesce(profile_row.plan_expires_at, profile_row.plan_original_expires_at) is null
        or coalesce(profile_row.plan_expires_at, profile_row.plan_original_expires_at) > now()
      )
    );

  return jsonb_build_object(
    'is_pro', pro_enabled,
    'can_use_erp', pro_enabled,
    'verified_badge', pro_enabled,
    'active_request_limit', case when pro_enabled then null else 5 end,
    'staff_limit', case when pro_enabled then null else 5 end,
    'unlimited_requests', pro_enabled,
    'plan_code', coalesce(profile_row.plan_code, 'free'),
    'plan_status', case when pro_enabled then coalesce(profile_row.plan_status, 'paid') else 'free' end,
    'plan_expires_at', coalesce(profile_row.plan_expires_at, profile_row.plan_original_expires_at),
    'plan_cancels_at_period_end', coalesce(profile_row.plan_cancels_at_period_end, false)
  );
end;
$$;

grant execute on function public.provider_feature_entitlements(uuid) to authenticated, service_role;
