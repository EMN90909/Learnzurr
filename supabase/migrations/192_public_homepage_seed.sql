-- 192_public_homepage_seed.sql
-- Operational Supabase migration for Learnzur. This file is intentionally small and composable so hosted Supabase projects can apply migrations in order.

create table if not exists public.migration_192_public_homepage_seed (
  id uuid primary key default gen_random_uuid(),
  key text not null unique,
  description text not null,
  enabled boolean not null default true,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

insert into public.migration_192_public_homepage_seed (key, description, payload) values
  ('public_homepage_seed.contract', 'Defines the public homepage seed contract used by the Go API and worker.', '{"source":"supabase","owner":"learnzur","version":192}'::jsonb),
  ('public_homepage_seed.audit', 'Ensures actions related to public homepage seed can be audited without storing secrets.', '{"audit_required":true,"idempotent":true}'::jsonb)
on conflict (key) do update set description = excluded.description, payload = excluded.payload, updated_at = now();

create index if not exists idx_migration_192_public_homepage_seed_enabled on public.migration_192_public_homepage_seed (enabled, created_at desc);
comment on table public.migration_192_public_homepage_seed is 'Learnzur migration 192: public homepage seed. Uses Supabase PostgreSQL as the shared source of truth.';
