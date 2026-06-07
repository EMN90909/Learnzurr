create table if not exists public.quest_progress (id uuid primary key default gen_random_uuid(), created_at timestamptz not null default now(), updated_at timestamptz not null default now(), learner_id uuid, age_group age_band, points int not null default 0, name text, payload jsonb not null default '{}'::jsonb);
alter table public.quest_progress enable row level security;
drop policy if exists quest_progress_admin_all on public.quest_progress;
create policy quest_progress_admin_all on public.quest_progress for all using (exists (select 1 from public.user_profiles p where p.id = auth.uid() and p.role = 'admin')) with check (exists (select 1 from public.user_profiles p where p.id = auth.uid() and p.role = 'admin'));
drop trigger if exists trg_quest_progress_updated_at on public.quest_progress;
create trigger trg_quest_progress_updated_at before update on public.quest_progress for each row execute function public.learnzur_touch_updated_at();
