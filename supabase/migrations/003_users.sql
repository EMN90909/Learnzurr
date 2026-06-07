create table if not exists public.users (
  id uuid primary key default gen_random_uuid(),
  auth_user_id uuid unique,
  role app_role not null,
  full_name text not null,
  email citext unique,
  phone text unique,
  password_hash text,
  status account_status not null default 'pending',
  last_login_at timestamptz,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (email is not null or phone is not null)
);
alter table public.users enable row level security;
create index if not exists idx_users_role_status on public.users(role,status);
create index if not exists idx_users_email_trgm on public.users using gin ((email::text) gin_trgm_ops);
