create or replace function public.delete_account(target_user_id uuid)
returns void
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  actor_id uuid := auth.uid();
  actor_is_admin boolean := false;
begin
  if actor_id is null then
    raise exception 'Authentication required';
  end if;

  select exists (
    select 1
    from public.user_profiles up
    where up.id = actor_id
      and (up.role = 'admin' or coalesce(up.is_admin, false) = true)
  ) into actor_is_admin;

  if actor_id <> target_user_id and not actor_is_admin then
    raise exception 'You can only delete your own account';
  end if;

  delete from public.notifications where user_id = target_user_id or actor_id = target_user_id;
  delete from public.email_otp_codes where user_id = target_user_id or email in (select email from public.user_profiles where id = target_user_id);
  delete from public.subscription_payment_requests where user_id = target_user_id;
  delete from public.payments where user_id = target_user_id;
  delete from public.subscriptions where user_id = target_user_id;
  delete from public.invoices where family_id = target_user_id or provider_id = target_user_id;
  delete from public.service_requests where requester_id = target_user_id or provider_id = target_user_id;
  delete from public.memorial_pages where user_id = target_user_id;
  delete from public.provider_payment_profiles where provider_id = target_user_id;
  delete from public.homes where owner_user_id = target_user_id or user_id = target_user_id or id = target_user_id;
  delete from public.vendors where owner_user_id = target_user_id or user_id = target_user_id or id = target_user_id;
  delete from public.user_settings where user_id = target_user_id;
  delete from public.user_profiles where id = target_user_id;

  if actor_is_admin then
    perform auth.admin_delete_user(target_user_id);
  end if;
exception
  when undefined_table then
    delete from public.user_profiles where id = target_user_id;
  when undefined_function then
    null;
end;
$$;

grant execute on function public.delete_account(uuid) to authenticated;
notify pgrst, 'reload schema';
