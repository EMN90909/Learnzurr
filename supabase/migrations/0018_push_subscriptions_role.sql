alter table public.push_subscriptions add column if not exists role text default 'bereaved';

create index if not exists push_subscriptions_role_idx on public.push_subscriptions(role);

notify pgrst, 'reload schema';
