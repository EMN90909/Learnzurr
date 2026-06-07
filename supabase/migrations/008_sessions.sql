create table if not exists public.sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  refresh_token_hash text not null unique,
  user_agent text,
  ip_hash text,
  expires_at timestamptz not null,
  revoked_at timestamptz,
  created_at timestamptz not null default now()
);
alter table public.sessions enable row level security;
create index if not exists idx_sessions_user_active on public.sessions(user_id, expires_at) where revoked_at is null;
