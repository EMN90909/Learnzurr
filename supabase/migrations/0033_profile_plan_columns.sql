-- Add missing plan and ban columns to user_profiles table
alter table public.user_profiles
  add column if not exists is_pro boolean default false,
  add column if not exists plan_code text default 'free',
  add column if not exists plan_status text default 'free',
  add column if not exists plan_expires_at timestamptz,
  add column if not exists is_banned boolean default false,
  add column if not exists ban_reason text,
  add column if not exists banned_until timestamptz,
  add column if not exists ban_count integer default 0,
  add column if not exists account_flagged boolean default false;

-- Create indexes for frequently queried columns
create index if not exists idx_user_profiles_is_pro on public.user_profiles(is_pro);
create index if not exists idx_user_profiles_plan_status on public.user_profiles(plan_status);
create index if not exists idx_user_profiles_is_banned on public.user_profiles(is_banned);
create index if not exists idx_user_profiles_plan_expires_at on public.user_profiles(plan_expires_at);

-- Add payment_methods table for storing verified payment cards
create table if not exists public.payment_methods (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.user_profiles(id) on delete cascade,
  provider text not null, -- 'stripe' or 'paypal'
  provider_method_id text not null unique,
  card_last_four text,
  card_brand text,
  is_default boolean default false,
  is_verified boolean default false,
  verified_at timestamptz,
  expires_at timestamptz,
  metadata jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_payment_methods_user_id on public.payment_methods(user_id);
create index if not exists idx_payment_methods_provider on public.payment_methods(provider);
create index if not exists idx_payment_methods_is_verified on public.payment_methods(is_verified);

-- Add payment_verifications table to track 3DS verification attempts
create table if not exists public.payment_verifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.user_profiles(id) on delete cascade,
  payment_method_id uuid references public.payment_methods(id) on delete set null,
  verification_type text not null, -- '3ds', '3ds2', etc
  provider text not null,
  provider_verification_id text,
  status text not null default 'pending', -- 'pending', 'approved', 'declined', 'expired'
  error_code text,
  error_message text,
  metadata jsonb,
  expires_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists idx_payment_verifications_user_id on public.payment_verifications(user_id);
create index if not exists idx_payment_verifications_status on public.payment_verifications(status);
create index if not exists idx_payment_verifications_created_at on public.payment_verifications(created_at);

-- Update subscriptions table to reference payment_methods
alter table public.subscriptions
  add column if not exists payment_method_id uuid references public.payment_methods(id) on delete set null;
