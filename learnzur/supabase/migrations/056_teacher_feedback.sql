create table if not exists public.teacher_feedback (id uuid primary key default gen_random_uuid(), created_at timestamptz not null default now(), updated_at timestamptz not null default now(), class_id uuid, learner_id uuid, teacher_id uuid, title text, score numeric, status learnzur_status not null default 'draft', payload jsonb not null default '{}'::jsonb);
alter table public.teacher_feedback enable row level security;
drop policy if exists teacher_feedback_admin_all on public.teacher_feedback;
create policy teacher_feedback_admin_all on public.teacher_feedback for all using (exists (select 1 from public.user_profiles p where p.id = auth.uid() and p.role = 'admin')) with check (exists (select 1 from public.user_profiles p where p.id = auth.uid() and p.role = 'admin'));
drop trigger if exists trg_teacher_feedback_updated_at on public.teacher_feedback;
create trigger trg_teacher_feedback_updated_at before update on public.teacher_feedback for each row execute function public.learnzur_touch_updated_at();
