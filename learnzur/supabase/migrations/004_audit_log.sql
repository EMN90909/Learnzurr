create table if not exists public.audit_logs (id uuid primary key default gen_random_uuid(), created_at timestamptz not null default now(), updated_at timestamptz not null default now(), actor_id uuid, action text not null, entity_table text, entity_id uuid, metadata jsonb not null default '{}'::jsonb);
alter table public.audit_logs enable row level security;
drop policy if exists audit_logs_admin_read on public.audit_logs;
create policy audit_logs_admin_read on public.audit_logs for select using (exists (select 1 from public.user_profiles p where p.id = auth.uid() and p.role = 'admin'));
