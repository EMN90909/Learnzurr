create table if not exists public.in_app_notifications (id uuid primary key default gen_random_uuid(), created_at timestamptz not null default now(), updated_at timestamptz not null default now(), user_id uuid, title text, body text, urgency text not null default 'normal', status learnzur_status not null default 'pending', payload jsonb not null default '{}'::jsonb);
alter table public.in_app_notifications enable row level security;
drop policy if exists in_app_notifications_admin_all on public.in_app_notifications;
create policy in_app_notifications_admin_all on public.in_app_notifications for all using (exists (select 1 from public.user_profiles p where p.id = auth.uid() and p.role = 'admin')) with check (exists (select 1 from public.user_profiles p where p.id = auth.uid() and p.role = 'admin'));
drop trigger if exists trg_in_app_notifications_updated_at on public.in_app_notifications;
create trigger trg_in_app_notifications_updated_at before update on public.in_app_notifications for each row execute function public.learnzur_touch_updated_at();
