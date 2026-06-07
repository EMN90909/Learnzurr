create table if not exists public.contest_winners (
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
alter table public.contest_winners enable row level security;
create index if not exists idx_contest_winners_status_created on public.contest_winners(status, created_at desc);
create index if not exists idx_contest_winners_user_id on public.contest_winners(user_id);
