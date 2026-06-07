create table if not exists public.notification_retries (id uuid primary key default gen_random_uuid(), created_at timestamptz not null default now(), updated_at timestamptz not null default now(), user_id uuid, title text, body text, urgency text not null default 'normal', status learnzur_status not null default 'pending', payload jsonb not null default '{}'::jsonb);
alter table public.notification_retries enable row level security;
drop policy if exists notification_retries_admin_all on public.notification_retries;
create policy notification_retries_admin_all on public.notification_retries for all using (exists (select 1 from public.user_profiles p where p.id = auth.uid() and p.role = 'admin')) with check (exists (select 1 from public.user_profiles p where p.id = auth.uid() and p.role = 'admin'));
drop trigger if exists trg_notification_retries_updated_at on public.notification_retries;
create trigger trg_notification_retries_updated_at before update on public.notification_retries for each row execute function public.learnzur_touch_updated_at();
