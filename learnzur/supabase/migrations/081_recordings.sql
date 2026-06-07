create table if not exists public.recordings (id uuid primary key default gen_random_uuid(), created_at timestamptz not null default now(), updated_at timestamptz not null default now(), room_id uuid, class_id uuid, user_id uuid, status learnzur_status not null default 'active', payload jsonb not null default '{}'::jsonb);
alter table public.recordings enable row level security;
drop policy if exists recordings_admin_all on public.recordings;
create policy recordings_admin_all on public.recordings for all using (exists (select 1 from public.user_profiles p where p.id = auth.uid() and p.role = 'admin')) with check (exists (select 1 from public.user_profiles p where p.id = auth.uid() and p.role = 'admin'));
drop trigger if exists trg_recordings_updated_at on public.recordings;
create trigger trg_recordings_updated_at before update on public.recordings for each row execute function public.learnzur_touch_updated_at();
