create table if not exists public.whiteboard_events (id uuid primary key default gen_random_uuid(), created_at timestamptz not null default now(), updated_at timestamptz not null default now(), room_id uuid, class_id uuid, user_id uuid, status learnzur_status not null default 'active', payload jsonb not null default '{}'::jsonb);
alter table public.whiteboard_events enable row level security;
drop policy if exists whiteboard_events_admin_all on public.whiteboard_events;
create policy whiteboard_events_admin_all on public.whiteboard_events for all using (exists (select 1 from public.user_profiles p where p.id = auth.uid() and p.role = 'admin')) with check (exists (select 1 from public.user_profiles p where p.id = auth.uid() and p.role = 'admin'));
drop trigger if exists trg_whiteboard_events_updated_at on public.whiteboard_events;
create trigger trg_whiteboard_events_updated_at before update on public.whiteboard_events for each row execute function public.learnzur_touch_updated_at();
