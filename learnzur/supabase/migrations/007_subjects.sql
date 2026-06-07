create table if not exists public.subjects (id uuid primary key default gen_random_uuid(), created_at timestamptz not null default now(), updated_at timestamptz not null default now(), code text not null unique, name text not null, metadata jsonb not null default '{}'::jsonb);
alter table public.subjects enable row level security;
drop policy if exists subjects_public_read on public.subjects;
create policy subjects_public_read on public.subjects for select using (true);
