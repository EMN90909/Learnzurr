grant usage on schema public to service_role;

grant select, insert, update, delete on public.erp_staff to service_role;
grant select, insert, update, delete on public.erp_staff_invites to service_role;
grant select, insert, update, delete on public.erp_organization_settings to service_role;
grant select, insert, update, delete on public.erp_cases to service_role;
grant select, insert, update, delete on public.erp_tasks to service_role;
grant select, insert, update, delete on public.erp_vehicles to service_role;
grant select, insert, update, delete on public.notifications to service_role;
grant select, insert, update, delete on public.push_subscriptions to service_role;
grant usage, select on all sequences in schema public to service_role;

create unique index if not exists erp_staff_home_email_idx
  on public.erp_staff (home_id, email)
  where email is not null;

notify pgrst, 'reload schema';
