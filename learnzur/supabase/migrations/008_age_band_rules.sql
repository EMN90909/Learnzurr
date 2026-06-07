create table if not exists public.age_band_rules (id uuid primary key default gen_random_uuid(), created_at timestamptz not null default now(), updated_at timestamptz not null default now(), code text not null unique, name text not null, metadata jsonb not null default '{}'::jsonb);
alter table public.age_band_rules enable row level security;
drop policy if exists age_band_rules_public_read on public.age_band_rules;
create policy age_band_rules_public_read on public.age_band_rules for select using (true);
