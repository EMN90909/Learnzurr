create table if not exists public.teacher_subjects (id uuid primary key default gen_random_uuid(), created_at timestamptz not null default now(), updated_at timestamptz not null default now(), teacher_id uuid, subject_code text not null);
alter table public.teacher_subjects enable row level security;
drop policy if exists teacher_subjects_admin_all on public.teacher_subjects;
create policy teacher_subjects_admin_all on public.teacher_subjects for all using (exists (select 1 from public.user_profiles p where p.id = auth.uid() and p.role = 'admin')) with check (exists (select 1 from public.user_profiles p where p.id = auth.uid() and p.role = 'admin'));
drop trigger if exists trg_teacher_subjects_updated_at on public.teacher_subjects;
create trigger trg_teacher_subjects_updated_at before update on public.teacher_subjects for each row execute function public.learnzur_touch_updated_at();
