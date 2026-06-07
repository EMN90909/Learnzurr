create table if not exists public.test_questions (id uuid primary key default gen_random_uuid(), created_at timestamptz not null default now(), updated_at timestamptz not null default now(), class_id uuid, learner_id uuid, teacher_id uuid, title text, score numeric, status learnzur_status not null default 'draft', payload jsonb not null default '{}'::jsonb);
alter table public.test_questions enable row level security;
drop policy if exists test_questions_admin_all on public.test_questions;
create policy test_questions_admin_all on public.test_questions for all using (exists (select 1 from public.user_profiles p where p.id = auth.uid() and p.role = 'admin')) with check (exists (select 1 from public.user_profiles p where p.id = auth.uid() and p.role = 'admin'));
drop trigger if exists trg_test_questions_updated_at on public.test_questions;
create trigger trg_test_questions_updated_at before update on public.test_questions for each row execute function public.learnzur_touch_updated_at();
