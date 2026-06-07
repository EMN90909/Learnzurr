create table if not exists public.contest_submissions (
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
alter table public.contest_submissions enable row level security;
create index if not exists idx_contest_submissions_status_created on public.contest_submissions(status, created_at desc);
create index if not exists idx_contest_submissions_user_id on public.contest_submissions(user_id);
