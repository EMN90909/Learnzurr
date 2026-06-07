create table if not exists public.gamfy_profiles (id uuid primary key default gen_random_uuid(), created_at timestamptz not null default now(), updated_at timestamptz not null default now(), learner_id uuid, age_group age_band, points int not null default 0, name text, payload jsonb not null default '{}'::jsonb);
alter table public.gamfy_profiles enable row level security;
drop policy if exists gamfy_profiles_admin_all on public.gamfy_profiles;
create policy gamfy_profiles_admin_all on public.gamfy_profiles for all using (exists (select 1 from public.user_profiles p where p.id = auth.uid() and p.role = 'admin')) with check (exists (select 1 from public.user_profiles p where p.id = auth.uid() and p.role = 'admin'));
drop trigger if exists trg_gamfy_profiles_updated_at on public.gamfy_profiles;
create trigger trg_gamfy_profiles_updated_at before update on public.gamfy_profiles for each row execute function public.learnzur_touch_updated_at();
