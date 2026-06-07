create table if not exists public.gamfy_badges (id uuid primary key default gen_random_uuid(), code text unique not null, name text not null, age_group age_group, description text not null, icon text not null default 'star', active boolean not null default true, created_at timestamptz not null default now());
alter table public.gamfy_badges enable row level security;
