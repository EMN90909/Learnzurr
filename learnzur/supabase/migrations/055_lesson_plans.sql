create table if not exists public.lesson_plans (id uuid primary key default gen_random_uuid(), created_at timestamptz not null default now(), updated_at timestamptz not null default now(), class_id uuid, learner_id uuid, teacher_id uuid, title text, score numeric, status learnzur_status not null default 'draft', payload jsonb not null default '{}'::jsonb);
alter table public.lesson_plans enable row level security;
drop policy if exists lesson_plans_admin_all on public.lesson_plans;
create policy lesson_plans_admin_all on public.lesson_plans for all using (exists (select 1 from public.user_profiles p where p.id = auth.uid() and p.role = 'admin')) with check (exists (select 1 from public.user_profiles p where p.id = auth.uid() and p.role = 'admin'));
drop trigger if exists trg_lesson_plans_updated_at on public.lesson_plans;
create trigger trg_lesson_plans_updated_at before update on public.lesson_plans for each row execute function public.learnzur_touch_updated_at();
