create table if not exists public.gamfy_points (learner_id uuid primary key references public.users(id) on delete cascade, total_points bigint not null default 0, weekly_points bigint not null default 0, updated_at timestamptz not null default now());
alter table public.gamfy_points enable row level security;
