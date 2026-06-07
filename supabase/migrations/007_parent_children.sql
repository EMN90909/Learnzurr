create table if not exists public.parent_children (
  id uuid primary key default gen_random_uuid(),
  parent_id uuid not null references public.users(id) on delete cascade,
  learner_id uuid not null references public.users(id) on delete cascade,
  relationship text not null default 'guardian',
  created_at timestamptz not null default now(),
  unique(parent_id, learner_id)
);
alter table public.parent_children enable row level security;
create index if not exists idx_parent_children_parent on public.parent_children(parent_id);
