create table if not exists public.plagiarism_checks (id uuid primary key default gen_random_uuid(), created_at timestamptz not null default now(), updated_at timestamptz not null default now(), class_id uuid, learner_id uuid, teacher_id uuid, title text, score numeric, status learnzur_status not null default 'draft', payload jsonb not null default '{}'::jsonb);
alter table public.plagiarism_checks enable row level security;
drop policy if exists plagiarism_checks_admin_all on public.plagiarism_checks;
create policy plagiarism_checks_admin_all on public.plagiarism_checks for all using (exists (select 1 from public.user_profiles p where p.id = auth.uid() and p.role = 'admin')) with check (exists (select 1 from public.user_profiles p where p.id = auth.uid() and p.role = 'admin'));
drop trigger if exists trg_plagiarism_checks_updated_at on public.plagiarism_checks;
create trigger trg_plagiarism_checks_updated_at before update on public.plagiarism_checks for each row execute function public.learnzur_touch_updated_at();
