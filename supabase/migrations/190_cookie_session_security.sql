-- Learnzur secure cookie session support: refresh tokens, CSRF, device sessions and auditability.
create table if not exists sessions (
  id uuid primary key default gen_random_uuid(),
  user_id text not null,
  role text not null check (role in ('parent','teacher','learner','admin')),
  refresh_token_hash text not null unique,
  device_id text not null,
  device_name text,
  ip_address text,
  user_agent text,
  created_at timestamptz not null default now(),
  expires_at timestamptz not null,
  last_used_at timestamptz,
  revoked_at timestamptz,
  revoke_reason text
);
create table if not exists csrf_tokens (
  id uuid primary key default gen_random_uuid(),
  user_id text,
  token_hash text not null unique,
  created_at timestamptz not null default now(),
  expires_at timestamptz not null,
  used_at timestamptz
);
create table if not exists device_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id text not null,
  device_id text not null,
  device_name text,
  user_agent text,
  ip_address text,
  first_seen_at timestamptz not null default now(),
  last_seen_at timestamptz not null default now(),
  trusted boolean not null default false,
  revoked_at timestamptz,
  unique(user_id, device_id)
);
create index if not exists idx_sessions_user_id on sessions(user_id);
create index if not exists idx_sessions_hash on sessions(refresh_token_hash);
create index if not exists idx_sessions_device on sessions(device_id);
create index if not exists idx_csrf_tokens_hash on csrf_tokens(token_hash);
create index if not exists idx_device_sessions_user_id on device_sessions(user_id);
alter table sessions enable row level security;
alter table csrf_tokens enable row level security;
alter table device_sessions enable row level security;
drop policy if exists sessions_owner_read on sessions;
create policy sessions_owner_read on sessions for select using (auth.uid()::text = user_id);
drop policy if exists device_sessions_owner_read on device_sessions;
create policy device_sessions_owner_read on device_sessions for select using (auth.uid()::text = user_id);
do $$ begin
  alter publication supabase_realtime add table sessions;
exception when duplicate_object then null;
end $$;
do $$ begin
  alter publication supabase_realtime add table device_sessions;
exception when duplicate_object then null;
end $$;
