create table if not exists public.mearn_audit (
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
alter table public.mearn_audit enable row level security;
create index if not exists idx_mearn_audit_status_created on public.mearn_audit(status, created_at desc);
create index if not exists idx_mearn_audit_user_id on public.mearn_audit(user_id);
