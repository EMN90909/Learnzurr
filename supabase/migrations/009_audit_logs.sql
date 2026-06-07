create table if not exists public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid references public.users(id) on delete set null,
  action text not null,
  entity_table text not null,
  entity_id uuid,
  severity severity_level not null default 'info',
  ip_hash text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);
alter table public.audit_logs enable row level security;
create index if not exists idx_audit_logs_actor_created on public.audit_logs(actor_id, created_at desc);
