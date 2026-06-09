-- 216_feature_flag_seed.sql
-- Operational Supabase migration for Learnzur. This file is intentionally small and composable so hosted Supabase projects can apply migrations in order.

create table if not exists public.migration_216_feature_flag_seed (
  id uuid primary key default gen_random_uuid(),
  key text not null unique,
  description text not null,
  enabled boolean not null default true,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

insert into public.migration_216_feature_flag_seed (key, description, payload) values
  ('feature_flag_seed.contract', 'Defines the feature flag seed contract used by the Go API and worker.', '{"source":"supabase","owner":"learnzur","version":216}'::jsonb),
  ('feature_flag_seed.audit', 'Ensures actions related to feature flag seed can be audited without storing secrets.', '{"audit_required":true,"idempotent":true}'::jsonb)
on conflict (key) do update set description = excluded.description, payload = excluded.payload, updated_at = now();

create index if not exists idx_migration_216_feature_flag_seed_enabled on public.migration_216_feature_flag_seed (enabled, created_at desc);
comment on table public.migration_216_feature_flag_seed is 'Learnzur migration 216: feature flag seed. Uses Supabase PostgreSQL as the shared source of truth.';
