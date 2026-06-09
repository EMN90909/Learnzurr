-- 208_parent_child_access_policies.sql
-- Operational Supabase migration for Learnzur. This file is intentionally small and composable so hosted Supabase projects can apply migrations in order.

create table if not exists public.migration_208_parent_child_access_policies (
  id uuid primary key default gen_random_uuid(),
  key text not null unique,
  description text not null,
  enabled boolean not null default true,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

insert into public.migration_208_parent_child_access_policies (key, description, payload) values
  ('parent_child_access_policies.contract', 'Defines the parent child access policies contract used by the Go API and worker.', '{"source":"supabase","owner":"learnzur","version":208}'::jsonb),
  ('parent_child_access_policies.audit', 'Ensures actions related to parent child access policies can be audited without storing secrets.', '{"audit_required":true,"idempotent":true}'::jsonb)
on conflict (key) do update set description = excluded.description, payload = excluded.payload, updated_at = now();

create index if not exists idx_migration_208_parent_child_access_policies_enabled on public.migration_208_parent_child_access_policies (enabled, created_at desc);
comment on table public.migration_208_parent_child_access_policies is 'Learnzur migration 208: parent child access policies. Uses Supabase PostgreSQL as the shared source of truth.';
