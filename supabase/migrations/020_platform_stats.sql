create table if not exists public.platform_stats (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.users(id) on delete set null,
  class_id uuid references public.classes(id) on delete cascade,
  status text not null default 'active',
  title text,
  description text,
  amount_cents int,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.platform_stats enable row level security;
create index if not exists idx_platform_stats_status_created on public.platform_stats(status, created_at desc);
create index if not exists idx_platform_stats_user_id on public.platform_stats(user_id);
