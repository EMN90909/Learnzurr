create table if not exists public.lms_files (id uuid primary key default gen_random_uuid(), created_at timestamptz not null default now(), updated_at timestamptz not null default now(), class_id uuid, learner_id uuid, teacher_id uuid, title text, score numeric, status learnzur_status not null default 'draft', payload jsonb not null default '{}'::jsonb);
alter table public.lms_files enable row level security;
drop policy if exists lms_files_admin_all on public.lms_files;
create policy lms_files_admin_all on public.lms_files for all using (exists (select 1 from public.user_profiles p where p.id = auth.uid() and p.role = 'admin')) with check (exists (select 1 from public.user_profiles p where p.id = auth.uid() and p.role = 'admin'));
drop trigger if exists trg_lms_files_updated_at on public.lms_files;
create trigger trg_lms_files_updated_at before update on public.lms_files for each row execute function public.learnzur_touch_updated_at();
