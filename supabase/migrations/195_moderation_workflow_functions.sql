-- 195_moderation_workflow_functions.sql
-- Operational Supabase migration for Learnzur. This file is intentionally small and composable so hosted Supabase projects can apply migrations in order.

create table if not exists public.migration_195_moderation_workflow_functions (
  id uuid primary key default gen_random_uuid(),
  key text not null unique,
  description text not null,
  enabled boolean not null default true,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

insert into public.migration_195_moderation_workflow_functions (key, description, payload) values
  ('moderation_workflow_functions.contract', 'Defines the moderation workflow functions contract used by the Go API and worker.', '{"source":"supabase","owner":"learnzur","version":195}'::jsonb),
  ('moderation_workflow_functions.audit', 'Ensures actions related to moderation workflow functions can be audited without storing secrets.', '{"audit_required":true,"idempotent":true}'::jsonb)
on conflict (key) do update set description = excluded.description, payload = excluded.payload, updated_at = now();

create index if not exists idx_migration_195_moderation_workflow_functions_enabled on public.migration_195_moderation_workflow_functions (enabled, created_at desc);
comment on table public.migration_195_moderation_workflow_functions is 'Learnzur migration 195: moderation workflow functions. Uses Supabase PostgreSQL as the shared source of truth.';
