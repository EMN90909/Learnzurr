create table if not exists public.reward_rules (id uuid primary key default gen_random_uuid(), created_at timestamptz not null default now(), updated_at timestamptz not null default now(), learner_id uuid, age_group age_band, points int not null default 0, name text, payload jsonb not null default '{}'::jsonb);
alter table public.reward_rules enable row level security;
drop policy if exists reward_rules_admin_all on public.reward_rules;
create policy reward_rules_admin_all on public.reward_rules for all using (exists (select 1 from public.user_profiles p where p.id = auth.uid() and p.role = 'admin')) with check (exists (select 1 from public.user_profiles p where p.id = auth.uid() and p.role = 'admin'));
drop trigger if exists trg_reward_rules_updated_at on public.reward_rules;
create trigger trg_reward_rules_updated_at before update on public.reward_rules for each row execute function public.learnzur_touch_updated_at();
