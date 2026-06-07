create table if not exists public.learner_badges (id uuid primary key default gen_random_uuid(), created_at timestamptz not null default now(), updated_at timestamptz not null default now(), learner_id uuid, age_group age_band, points int not null default 0, name text, payload jsonb not null default '{}'::jsonb);
alter table public.learner_badges enable row level security;
drop policy if exists learner_badges_admin_all on public.learner_badges;
create policy learner_badges_admin_all on public.learner_badges for all using (exists (select 1 from public.user_profiles p where p.id = auth.uid() and p.role = 'admin')) with check (exists (select 1 from public.user_profiles p where p.id = auth.uid() and p.role = 'admin'));
drop trigger if exists trg_learner_badges_updated_at on public.learner_badges;
create trigger trg_learner_badges_updated_at before update on public.learner_badges for each row execute function public.learnzur_touch_updated_at();
