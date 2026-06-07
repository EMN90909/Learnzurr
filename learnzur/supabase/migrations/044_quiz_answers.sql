create table if not exists public.quiz_answers (id uuid primary key default gen_random_uuid(), created_at timestamptz not null default now(), updated_at timestamptz not null default now(), class_id uuid, learner_id uuid, teacher_id uuid, title text, score numeric, status learnzur_status not null default 'draft', payload jsonb not null default '{}'::jsonb);
alter table public.quiz_answers enable row level security;
drop policy if exists quiz_answers_admin_all on public.quiz_answers;
create policy quiz_answers_admin_all on public.quiz_answers for all using (exists (select 1 from public.user_profiles p where p.id = auth.uid() and p.role = 'admin')) with check (exists (select 1 from public.user_profiles p where p.id = auth.uid() and p.role = 'admin'));
drop trigger if exists trg_quiz_answers_updated_at on public.quiz_answers;
create trigger trg_quiz_answers_updated_at before update on public.quiz_answers for each row execute function public.learnzur_touch_updated_at();
