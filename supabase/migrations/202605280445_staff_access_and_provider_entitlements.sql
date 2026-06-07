-- Struta staff access and provider entitlement support.
-- This migration fixes database-side Supabase issues used by /staff/auth and Pro/Free feature gating.
-- It does not configure frontend Vite environment variables; set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in Render.

alter table public.user_profiles add column if not exists plan_code text default 'free';
alter table public.user_profiles add column if not exists plan_status text default 'free';
alter table public.user_profiles add column if not exists plan_expires_at timestamptz;
alter table public.user_profiles add column if not exists is_pro boolean default false;
alter table public.user_profiles add column if not exists staff_business_type text;
alter table public.user_profiles add column if not exists organization_id uuid;
alter table public.user_profiles add column if not exists manager_id uuid;
alter table public.user_profiles add column if not exists active boolean default true;

create table if not exists public.erp_organization_settings (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null unique,
  organization_type text not null default 'home',
  general_code text,
  created_by uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists erp_organization_settings_general_code_unique
  on public.erp_organization_settings(general_code)
  where general_code is not null;

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
  staff_row record;
  org_row record;
  destination text;
begin
  if trim(coalesce(staff_name_input, '')) = '' then
    raise exception 'Staff name is required';
  end if;

  if trim(coalesce(general_code_input, '')) = '' then
    raise exception 'Organisation code is required';
  end if;

  select * into org_row
  from public.erp_organization_settings
  where general_code = trim(general_code_input)
  limit 1;

  if org_row.organization_id is null then
    raise exception 'Invalid organisation code';
  end if;

  select id, full_name, role, staff_role, staff_business_type, organization_id, manager_id, active
  into staff_row
  from public.user_profiles
  where organization_id = org_row.organization_id
    and lower(trim(full_name)) = lower(trim(staff_name_input))
    and coalesce(active, true) = true
  limit 1;

  if staff_row.id is null then
    raise exception 'Staff member not found for this code';
  end if;

  destination := case
    when coalesce(staff_row.staff_business_type, org_row.organization_type) = 'vendor' then '/marketplace'
    else '/manager'
  end;

  return jsonb_build_object(
    'success', true,
    'staff_id', staff_row.id,
    'staff_name', staff_row.full_name,
    'role', staff_row.role,
    'staff_role', staff_row.staff_role,
    'organization_id', staff_row.organization_id,
    'manager_id', staff_row.manager_id,
    'staff_business_type', coalesce(staff_row.staff_business_type, org_row.organization_type),
    'portal_path', destination
  );
end;
$$;

grant execute on function public.staff_login_by_code(text, text) to anon, authenticated;

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
begin
  select id, role, plan_code, plan_status, plan_expires_at, is_pro
  into profile_row
  from public.user_profiles
  where id = provider_user_id;

  if profile_row.id is null then
    raise exception 'Provider not found';
  end if;

  pro_enabled := coalesce(profile_row.is_pro, false)
    or (
      coalesce(profile_row.plan_code, 'free') <> 'free'
      and coalesce(profile_row.plan_status, 'free') in ('paid', 'active')
      and (profile_row.plan_expires_at is null or profile_row.plan_expires_at > now())
    );

  return jsonb_build_object(
    'is_pro', pro_enabled,
    'can_use_erp', pro_enabled,
    'verified_badge', pro_enabled,
    'active_request_limit', case when pro_enabled then null else 5 end,
    'staff_limit', case when pro_enabled then null else 5 end,
    'unlimited_requests', pro_enabled,
    'plan_code', coalesce(profile_row.plan_code, 'free'),
    'plan_status', case when pro_enabled then 'paid' else 'free' end
  );
end;
$$;

grant execute on function public.provider_feature_entitlements(uuid) to authenticated, service_role;

update public.user_profiles
set plan_code = coalesce(plan_code, 'free'),
    plan_status = coalesce(plan_status, 'free'),
    is_pro = coalesce(is_pro, false)
where role in ('operations', 'marketplace', 'family', 'admin');
