create table if not exists public.attendance_records (id uuid primary key default gen_random_uuid(), created_at timestamptz not null default now(), updated_at timestamptz not null default now(), session_id uuid, learner_id uuid, present boolean not null default false);
alter table public.attendance_records enable row level security;
drop policy if exists attendance_records_admin_all on public.attendance_records;
create policy attendance_records_admin_all on public.attendance_records for all using (exists (select 1 from public.user_profiles p where p.id = auth.uid() and p.role = 'admin')) with check (exists (select 1 from public.user_profiles p where p.id = auth.uid() and p.role = 'admin'));
drop trigger if exists trg_attendance_records_updated_at on public.attendance_records;
create trigger trg_attendance_records_updated_at before update on public.attendance_records for each row execute function public.learnzur_touch_updated_at();
