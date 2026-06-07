create table if not exists public.levels (id uuid primary key default gen_random_uuid(), created_at timestamptz not null default now(), updated_at timestamptz not null default now(), learner_id uuid, age_group age_band, points int not null default 0, name text, payload jsonb not null default '{}'::jsonb);
alter table public.levels enable row level security;
drop policy if exists levels_admin_all on public.levels;
create policy levels_admin_all on public.levels for all using (exists (select 1 from public.user_profiles p where p.id = auth.uid() and p.role = 'admin')) with check (exists (select 1 from public.user_profiles p where p.id = auth.uid() and p.role = 'admin'));
drop trigger if exists trg_levels_updated_at on public.levels;
create trigger trg_levels_updated_at before update on public.levels for each row execute function public.learnzur_touch_updated_at();
