create table if not exists public.progress_snapshots (id uuid primary key default gen_random_uuid(), created_at timestamptz not null default now(), updated_at timestamptz not null default now(), class_id uuid, learner_id uuid, teacher_id uuid, title text, score numeric, status learnzur_status not null default 'draft', payload jsonb not null default '{}'::jsonb);
alter table public.progress_snapshots enable row level security;
drop policy if exists progress_snapshots_admin_all on public.progress_snapshots;
create policy progress_snapshots_admin_all on public.progress_snapshots for all using (exists (select 1 from public.user_profiles p where p.id = auth.uid() and p.role = 'admin')) with check (exists (select 1 from public.user_profiles p where p.id = auth.uid() and p.role = 'admin'));
drop trigger if exists trg_progress_snapshots_updated_at on public.progress_snapshots;
create trigger trg_progress_snapshots_updated_at before update on public.progress_snapshots for each row execute function public.learnzur_touch_updated_at();
