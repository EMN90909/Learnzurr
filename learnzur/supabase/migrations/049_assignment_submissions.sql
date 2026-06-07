create table if not exists public.assignment_submissions (id uuid primary key default gen_random_uuid(), created_at timestamptz not null default now(), updated_at timestamptz not null default now(), class_id uuid, learner_id uuid, teacher_id uuid, title text, score numeric, status learnzur_status not null default 'draft', payload jsonb not null default '{}'::jsonb);
alter table public.assignment_submissions enable row level security;
drop policy if exists assignment_submissions_admin_all on public.assignment_submissions;
create policy assignment_submissions_admin_all on public.assignment_submissions for all using (exists (select 1 from public.user_profiles p where p.id = auth.uid() and p.role = 'admin')) with check (exists (select 1 from public.user_profiles p where p.id = auth.uid() and p.role = 'admin'));
drop trigger if exists trg_assignment_submissions_updated_at on public.assignment_submissions;
create trigger trg_assignment_submissions_updated_at before update on public.assignment_submissions for each row execute function public.learnzur_touch_updated_at();
