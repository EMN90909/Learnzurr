create or replace function public.delete_account(target_user_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  requester_id uuid := auth.uid();
  requester_role text;
begin
  if requester_id is null then
    raise exception 'Authentication required';
  end if;

  select role into requester_role
  from public.user_profiles
  where id = requester_id;

  if requester_id <> target_user_id and coalesce(requester_role, '') <> 'admin' then
    raise exception 'Not allowed to delete this account';
  end if;

  delete from public.notifications where user_id = target_user_id;
  delete from public.user_settings where user_id = target_user_id;
  delete from public.subscriptions where user_id = target_user_id;
  delete from public.email_otp_codes where user_id = target_user_id or email in (select email from public.user_profiles where id = target_user_id);
  delete from public.user_profiles where id = target_user_id;

  return jsonb_build_object('ok', true, 'deleted_user_id', target_user_id);
end;
$$;

grant execute on function public.delete_account(uuid) to authenticated;
