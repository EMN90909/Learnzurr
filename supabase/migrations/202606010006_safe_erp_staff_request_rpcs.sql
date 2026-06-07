create or replace function public.erp_add_staff(
  actor_id_input uuid,
  organization_id_input uuid,
  name_input text,
  email_input text,
  phone_input text default null,
  role_input text default 'Staff'
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  actor_role text;
  staff_id uuid;
  org_type text := 'home';
  code_value text;
  clean_email text := lower(trim(coalesce(email_input, '')));
  clean_name text := nullif(trim(coalesce(name_input, '')), '');
begin
  if organization_id_input is null then
    return jsonb_build_object('success', false, 'error', 'Organization is missing.');
  end if;

  if clean_name is null or clean_email = '' then
    return jsonb_build_object('success', false, 'error', 'Staff name and email are required.');
  end if;

  select lower(coalesce(role, 'staff')) into actor_role
  from public.erp_staff
  where (id = actor_id_input or user_id = actor_id_input)
    and home_id = organization_id_input
  limit 1;

  if actor_role is null then
    select lower(coalesce(role, '')) into actor_role
    from public.user_profiles
    where id = actor_id_input
      and (id = organization_id_input or organization_id = organization_id_input or manager_id = organization_id_input)
    limit 1;
  end if;

  if coalesce(actor_role, '') not in ('admin', 'manager', 'owner / manager', 'operations', 'marketplace') then
    return jsonb_build_object('success', false, 'error', 'Only admin or manager can add staff.');
  end if;

  select lower(coalesce(organization_type, 'home')), general_code into org_type, code_value
  from public.erp_organization_settings
  where organization_id = organization_id_input
  limit 1;

  insert into public.erp_staff (home_id, name, email, phone, role, status, is_active, organization_type, team_code, invited_by, created_at, updated_at)
  values (organization_id_input, clean_name, clean_email, nullif(trim(coalesce(phone_input, '')), ''), coalesce(nullif(trim(role_input), ''), 'Staff'), 'active', true, coalesce(org_type, 'home'), code_value, actor_id_input, now(), now())
  on conflict do nothing
  returning id into staff_id;

  if staff_id is null then
    select id into staff_id from public.erp_staff where home_id = organization_id_input and lower(email) = clean_email limit 1;
    if staff_id is null then
      return jsonb_build_object('success', false, 'error', 'Staff already exists or could not be created.');
    end if;
  end if;

  return jsonb_build_object('success', true, 'staff_id', staff_id);
exception when others then
  return jsonb_build_object('success', false, 'error', sqlerrm);
end;
$$;

create or replace function public.erp_update_request_status(
  request_id_input uuid,
  staff_id_input uuid,
  status_input text
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  org_id uuid;
  actor_role text;
  allowed boolean := false;
  clean_status text := lower(trim(coalesce(status_input, '')));
begin
  if request_id_input is null then
    return jsonb_build_object('success', false, 'error', 'Request is missing.');
  end if;

  select provider_id into org_id
  from public.service_requests
  where id = request_id_input;

  if org_id is null then
    return jsonb_build_object('success', false, 'error', 'Request not found.');
  end if;

  select lower(coalesce(role, 'staff')) into actor_role
  from public.erp_staff
  where (id = staff_id_input or user_id = staff_id_input)
    and home_id = org_id
  limit 1;

  allowed := coalesce(actor_role, '') in ('admin', 'manager', 'owner / manager', 'operations', 'marketplace', 'coordinator')
    or exists (
      select 1 from public.user_profiles up
      where up.id = staff_id_input
        and lower(coalesce(up.role, '')) in ('admin','operations','marketplace','manager','owner / manager')
        and (up.id = org_id or up.organization_id = org_id or up.manager_id = org_id)
    );

  if not allowed then
    return jsonb_build_object('success', false, 'error', 'Only manager/coordinator can update this request.');
  end if;

  if clean_status = '' then
    return jsonb_build_object('success', false, 'error', 'Status is required.');
  end if;

  update public.service_requests
  set status = clean_status,
      updated_at = now()
  where id = request_id_input;

  return jsonb_build_object('success', true, 'request_id', request_id_input, 'status', clean_status);
exception when others then
  return jsonb_build_object('success', false, 'error', sqlerrm);
end;
$$;

grant execute on function public.erp_add_staff(uuid, uuid, text, text, text, text) to authenticated;
grant execute on function public.erp_update_request_status(uuid, uuid, text) to authenticated;
notify pgrst, 'reload schema';
