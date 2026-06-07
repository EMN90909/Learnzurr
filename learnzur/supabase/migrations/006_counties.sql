create table if not exists public.counties (id uuid primary key default gen_random_uuid(), created_at timestamptz not null default now(), updated_at timestamptz not null default now(), code text not null unique, name text not null, metadata jsonb not null default '{}'::jsonb);
alter table public.counties enable row level security;
drop policy if exists counties_public_read on public.counties;
create policy counties_public_read on public.counties for select using (true);
