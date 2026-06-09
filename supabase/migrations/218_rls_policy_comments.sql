-- 218_rls_policy_comments.sql
-- Operational Supabase migration for Learnzur. This file is intentionally small and composable so hosted Supabase projects can apply migrations in order.

create table if not exists public.migration_218_rls_policy_comments (
  id uuid primary key default gen_random_uuid(),
  key text not null unique,
  description text not null,
  enabled boolean not null default true,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

insert into public.migration_218_rls_policy_comments (key, description, payload) values
  ('rls_policy_comments.contract', 'Defines the rls policy comments contract used by the Go API and worker.', '{"source":"supabase","owner":"learnzur","version":218}'::jsonb),
  ('rls_policy_comments.audit', 'Ensures actions related to rls policy comments can be audited without storing secrets.', '{"audit_required":true,"idempotent":true}'::jsonb)
on conflict (key) do update set description = excluded.description, payload = excluded.payload, updated_at = now();

create index if not exists idx_migration_218_rls_policy_comments_enabled on public.migration_218_rls_policy_comments (enabled, created_at desc);
comment on table public.migration_218_rls_policy_comments is 'Learnzur migration 218: rls policy comments. Uses Supabase PostgreSQL as the shared source of truth.';
