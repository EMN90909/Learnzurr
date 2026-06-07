create table if not exists public.attendance_sessions (id uuid primary key default gen_random_uuid(), created_at timestamptz not null default now(), updated_at timestamptz not null default now(), class_id uuid, starts_at timestamptz, ends_at timestamptz);
alter table public.attendance_sessions enable row level security;
drop policy if exists attendance_sessions_admin_all on public.attendance_sessions;
create policy attendance_sessions_admin_all on public.attendance_sessions for all using (exists (select 1 from public.user_profiles p where p.id = auth.uid() and p.role = 'admin')) with check (exists (select 1 from public.user_profiles p where p.id = auth.uid() and p.role = 'admin'));
drop trigger if exists trg_attendance_sessions_updated_at on public.attendance_sessions;
create trigger trg_attendance_sessions_updated_at before update on public.attendance_sessions for each row execute function public.learnzur_touch_updated_at();
