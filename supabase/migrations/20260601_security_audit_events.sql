create table if not exists public.security_audit_events (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid null,
  actor_email text null,
  actor_role text null,
  action text not null,
  status text not null check (status in ('success', 'failure')),
  ip_address text null,
  user_agent text null,
  path text null,
  method text null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

alter table public.security_audit_events enable row level security;

drop policy if exists security_audit_events_admin_read on public.security_audit_events;
create policy security_audit_events_admin_read
on public.security_audit_events
for select
to authenticated
using (
  exists (
    select 1
    from public.user_profiles up
    where up.id = auth.uid()
      and lower(coalesce(up.role, '')) = 'admin'
  )
);

drop policy if exists security_audit_events_service_insert on public.security_audit_events;
create policy security_audit_events_service_insert
on public.security_audit_events
for insert
to authenticated
with check (
  exists (
    select 1
    from public.user_profiles up
    where up.id = auth.uid()
      and lower(coalesce(up.role, '')) = 'admin'
  )
);

create index if not exists security_audit_events_actor_id_idx on public.security_audit_events(actor_id);
create index if not exists security_audit_events_action_idx on public.security_audit_events(action);
create index if not exists security_audit_events_created_at_idx on public.security_audit_events(created_at desc);
