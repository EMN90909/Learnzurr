create table if not exists public.feature_flags (id uuid primary key default gen_random_uuid(), created_at timestamptz not null default now(), updated_at timestamptz not null default now(), code text not null unique, name text not null, metadata jsonb not null default '{}'::jsonb);
alter table public.feature_flags enable row level security;
drop policy if exists feature_flags_public_read on public.feature_flags;
create policy feature_flags_public_read on public.feature_flags for select using (true);
