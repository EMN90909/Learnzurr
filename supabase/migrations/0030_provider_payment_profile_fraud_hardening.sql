-- Provider receiving-details hardening for invoice payouts.
-- This supports server-side validation, verification reset on changes, and audit/risk metadata.

create extension if not exists pgcrypto;

alter table public.provider_payment_profiles
  add column if not exists paybill_number text,
  add column if not exists account_number text,
  add column if not exists paypal_email text,
  add column if not exists stripe_account_id text,
  add column if not exists settlement_currency text default 'KES',
  add column if not exists is_verified boolean not null default false,
  add column if not exists verification_status text not null default 'needs_review',
  add column if not exists risk_flags jsonb not null default '{}'::jsonb,
  add column if not exists last_submitted_at timestamptz,
  add column if not exists last_verified_snapshot jsonb;

create unique index if not exists idx_provider_payment_profiles_provider_id
  on public.provider_payment_profiles(provider_id);

create index if not exists idx_provider_payment_profiles_status
  on public.provider_payment_profiles(verification_status, is_active);

create table if not exists public.provider_payment_profile_audit_logs (
  id uuid primary key default gen_random_uuid(),
  provider_id uuid not null,
  actor_id uuid,
  action text not null,
  before_data jsonb,
  after_data jsonb,
  risk_flags jsonb not null default '{}'::jsonb,
  ip_address text,
  user_agent text,
  created_at timestamptz not null default now()
);

create index if not exists idx_provider_payment_profile_audit_provider
  on public.provider_payment_profile_audit_logs(provider_id, created_at desc);
