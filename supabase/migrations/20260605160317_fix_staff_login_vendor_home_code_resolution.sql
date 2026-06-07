create or replace function public.staff_login_by_code(staff_name_input text, general_code_input text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  input_name text := lower(trim(coalesce(staff_name_input, '')));
  input_code text := replace(trim(coalesce(general_code_input, '')), ' ', '');
  staff_id_value uuid;
  staff_user_id_value uuid;
  staff_name_value text;
  staff_email_value text;
  staff_role_value text;
  organization_id_value uuid;
  organization_type_value text;
  business_name_value text;
  portal_path_value text := '/manager';
begin
  if input_name = '' or input_code = '' then
    return jsonb_build_object('success', false, 'error', 'Enter staff email/name and organisation code.');
  end if;

  select
    staff_tbl.id,
    staff_tbl.user_id,
    coalesce(staff_tbl.name, staff_tbl.email),
    staff_tbl.email,
    coalesce(staff_tbl.role, 'staff'),
    coalesce(staff_tbl.organization_id, staff_tbl.vendor_id, staff_tbl.home_id),
    lower(coalesce(org_tbl.organization_type, staff_tbl.organization_type, case when staff_tbl.vendor_id is not null then 'vendor' else 'home' end))
  into
    staff_id_value,
    staff_user_id_value,
    staff_name_value,
    staff_email_value,
    staff_role_value,
    organization_id_value,
    organization_type_value
  from public.erp_staff staff_tbl
  join public.erp_organization_settings org_tbl
    on org_tbl.organization_id = coalesce(staff_tbl.organization_id, staff_tbl.vendor_id, staff_tbl.home_id)
  where lower(coalesce(staff_tbl.status, 'active')) in ('active', 'enabled', 'invited')
    and coalesce(staff_tbl.is_active, true) = true
    and replace(trim(coalesce(org_tbl.general_code, '')), ' ', '') = input_code
    and (
      lower(trim(coalesce(staff_tbl.email, ''))) = input_name
      or lower(trim(coalesce(staff_tbl.name, ''))) = input_name
      or lower(trim(coalesce(staff_tbl.phone, ''))) = input_name
    )
  limit 1;

  if staff_id_value is null then
    select
      staff_tbl.id,
      staff_tbl.user_id,
      coalesce(staff_tbl.name, staff_tbl.email),
      staff_tbl.email,
      coalesce(staff_tbl.role, 'staff'),
      coalesce(staff_tbl.organization_id, staff_tbl.vendor_id, staff_tbl.home_id),
      lower(coalesce(staff_tbl.organization_type, case when staff_tbl.vendor_id is not null then 'vendor' else 'home' end))
    into
      staff_id_value,
      staff_user_id_value,
      staff_name_value,
      staff_email_value,
      staff_role_value,
      organization_id_value,
      organization_type_value
    from public.erp_staff staff_tbl
    where lower(coalesce(staff_tbl.status, 'active')) in ('active', 'enabled', 'invited')
      and coalesce(staff_tbl.is_active, true) = true
      and replace(trim(coalesce(staff_tbl.team_code, '')), ' ', '') = input_code
      and (
        lower(trim(coalesce(staff_tbl.email, ''))) = input_name
        or lower(trim(coalesce(staff_tbl.name, ''))) = input_name
        or lower(trim(coalesce(staff_tbl.phone, ''))) = input_name
      )
    limit 1;
  end if;

  if staff_id_value is not null then
    if organization_type_value in ('vendor', 'marketplace') then
      portal_path_value := '/marketplace';
      select business_name into business_name_value from public.vendors where id = organization_id_value limit 1;
    else
      portal_path_value := '/manager';
      select name into business_name_value from public.homes where id = organization_id_value limit 1;
    end if;

    update public.erp_staff
    set is_active = true, last_login_at = now(), updated_at = now()
    where id = staff_id_value;

    return jsonb_build_object('success', true, 'staff_id', coalesce(staff_user_id_value, staff_id_value), 'erp_staff_id', staff_id_value, 'staff_name', staff_name_value, 'email', staff_email_value, 'role', staff_role_value, 'staff_role', staff_role_value, 'organization_id', organization_id_value, 'business_id', organization_id_value, 'manager_id', organization_id_value, 'business_name', business_name_value, 'staff_business_type', case when portal_path_value = '/marketplace' then 'vendor' else 'operations' end, 'portal_path', portal_path_value);
  end if;

  return jsonb_build_object('success', false, 'error', 'Could not verify those staff details. Use the exact staff email/name and organisation code from your manager.');
end;
$$;

grant execute on function public.staff_login_by_code(text, text) to anon, authenticated;
notify pgrst, 'reload schema';
