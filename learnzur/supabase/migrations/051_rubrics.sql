create table if not exists public.rubrics (id uuid primary key default gen_random_uuid(), created_at timestamptz not null default now(), updated_at timestamptz not null default now(), class_id uuid, learner_id uuid, teacher_id uuid, title text, score numeric, status learnzur_status not null default 'draft', payload jsonb not null default '{}'::jsonb);
alter table public.rubrics enable row level security;
drop policy if exists rubrics_admin_all on public.rubrics;
create policy rubrics_admin_all on public.rubrics for all using (exists (select 1 from public.user_profiles p where p.id = auth.uid() and p.role = 'admin')) with check (exists (select 1 from public.user_profiles p where p.id = auth.uid() and p.role = 'admin'));
drop trigger if exists trg_rubrics_updated_at on public.rubrics;
create trigger trg_rubrics_updated_at before update on public.rubrics for each row execute function public.learnzur_touch_updated_at();
