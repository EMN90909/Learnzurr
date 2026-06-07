do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'erp_tasks_case_id_fk'
  ) then
    alter table public.erp_tasks
      add constraint erp_tasks_case_id_fk
      foreign key (case_id) references public.erp_cases(id) on delete cascade;
  end if;
end $$;

create index if not exists notifications_user_created_idx
  on public.notifications (user_id, created_at desc);

create index if not exists subscriptions_user_idx
  on public.subscriptions (user_id);

create index if not exists subscriptions_home_idx
  on public.subscriptions (home_id);

create index if not exists subscriptions_provider_idx
  on public.subscriptions (provider_id);

create index if not exists service_requests_provider_status_idx
  on public.service_requests (provider_id, provider_type, status, created_at desc);

create index if not exists push_subscriptions_user_idx
  on public.push_subscriptions (user_id);

notify pgrst, 'reload schema';
