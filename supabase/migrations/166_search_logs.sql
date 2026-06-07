create table if not exists public.search_logs (id uuid primary key default gen_random_uuid(), user_id uuid references public.users(id), query text not null, filters jsonb not null default '{}'::jsonb, result_count int not null default 0, created_at timestamptz not null default now());
alter table public.search_logs enable row level security;
create index if not exists idx_search_logs_query_trgm on public.search_logs using gin(query gin_trgm_ops);
