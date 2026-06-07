create table if not exists public.push_subscriptions (id uuid primary key default gen_random_uuid(), created_at timestamptz not null default now(), updated_at timestamptz not null default now(), user_id uuid, title text, body text, urgency text not null default 'normal', status learnzur_status not null default 'pending', payload jsonb not null default '{}'::jsonb);
alter table public.push_subscriptions enable row level security;
drop policy if exists push_subscriptions_admin_all on public.push_subscriptions;
create policy push_subscriptions_admin_all on public.push_subscriptions for all using (exists (select 1 from public.user_profiles p where p.id = auth.uid() and p.role = 'admin')) with check (exists (select 1 from public.user_profiles p where p.id = auth.uid() and p.role = 'admin'));
drop trigger if exists trg_push_subscriptions_updated_at on public.push_subscriptions;
create trigger trg_push_subscriptions_updated_at before update on public.push_subscriptions for each row execute function public.learnzur_touch_updated_at();
