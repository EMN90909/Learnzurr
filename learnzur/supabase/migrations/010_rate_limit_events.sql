create table if not exists public.rate_limit_events (id uuid primary key default gen_random_uuid(), created_at timestamptz not null default now(), updated_at timestamptz not null default now(), code text not null unique, name text not null, metadata jsonb not null default '{}'::jsonb);
alter table public.rate_limit_events enable row level security;
drop policy if exists rate_limit_events_public_read on public.rate_limit_events;
create policy rate_limit_events_public_read on public.rate_limit_events for select using (true);
