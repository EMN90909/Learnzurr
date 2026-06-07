create table if not exists public.learner_profiles (
  user_id uuid primary key references public.users(id) on delete cascade,
  username citext unique not null,
  pin_hash text not null,
  date_of_birth date not null,
  computed_age int generated always as (date_part('year', age(date_of_birth))::int) stored,
  current_age_group age_group not null,
  avatar_url text,
  theme text not null default 'calm',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (computed_age between 8 and 18)
);
alter table public.learner_profiles enable row level security;
create index if not exists idx_learner_username on public.learner_profiles(username);
