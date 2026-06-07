create table if not exists public.smtp_events (id uuid primary key default gen_random_uuid(), created_at timestamptz not null default now(), updated_at timestamptz not null default now(), user_id uuid, title text, body text, urgency text not null default 'normal', status learnzur_status not null default 'pending', payload jsonb not null default '{}'::jsonb);
alter table public.smtp_events enable row level security;
drop policy if exists smtp_events_admin_all on public.smtp_events;
create policy smtp_events_admin_all on public.smtp_events for all using (exists (select 1 from public.user_profiles p where p.id = auth.uid() and p.role = 'admin')) with check (exists (select 1 from public.user_profiles p where p.id = auth.uid() and p.role = 'admin'));
drop trigger if exists trg_smtp_events_updated_at on public.smtp_events;
create trigger trg_smtp_events_updated_at before update on public.smtp_events for each row execute function public.learnzur_touch_updated_at();
