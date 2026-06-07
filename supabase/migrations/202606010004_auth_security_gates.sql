alter table public.user_profiles
  add column if not exists password_reset_requested_at timestamptz,
  add column if not exists password_reset_completed_at timestamptz,
  add column if not exists password_reset_required boolean not null default false,
  add column if not exists email_verified_at timestamptz,
  add column if not exists terms_accepted_at timestamptz,
  add column if not exists onboarding_completed_at timestamptz,
  add column if not exists provider_payment_setup_completed_at timestamptz,
  add column if not exists kra_pin text,
  add column if not exists pin_number text,
  add column if not exists suspended_at timestamptz,
  add column if not exists suspended_by uuid;

create index if not exists idx_user_profiles_password_reset_required on public.user_profiles(password_reset_required);
create index if not exists idx_user_profiles_email_verified_at on public.user_profiles(email_verified_at);
create index if not exists idx_user_profiles_terms_accepted_at on public.user_profiles(terms_accepted_at);
create index if not exists idx_user_profiles_suspended_at on public.user_profiles(suspended_at);

notify pgrst, 'reload schema';
