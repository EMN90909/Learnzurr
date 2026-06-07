alter table public.user_profiles
  add column if not exists email_verified_at timestamptz;

create table if not exists public.email_otp_codes (
  id uuid primary key default gen_random_uuid(),
  email text not null,
  user_id uuid null references auth.users(id) on delete cascade,
  purpose text not null check (purpose in ('signup', 'signin')),
  code text not null,
  expires_at timestamptz not null,
  consumed_at timestamptz null,
  created_at timestamptz not null default now()
);

create index if not exists email_otp_codes_email_purpose_idx
  on public.email_otp_codes (email, purpose, created_at desc);

create index if not exists email_otp_codes_user_id_idx
  on public.email_otp_codes (user_id);
