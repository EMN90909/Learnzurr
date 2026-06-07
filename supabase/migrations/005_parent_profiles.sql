create table if not exists public.parent_profiles (
  user_id uuid primary key references public.users(id) on delete cascade,
  county text not null,
  mpesa_phone text,
  notification_email boolean not null default true,
  notification_push boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.parent_profiles enable row level security;
