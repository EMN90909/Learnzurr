create table if not exists public.otp_store (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.users(id) on delete cascade,
  destination citext not null,
  purpose text not null,
  otp_hash text not null,
  attempts int not null default 0,
  expires_at timestamptz not null,
  verified_at timestamptz,
  created_at timestamptz not null default now()
);
alter table public.otp_store enable row level security;
create index if not exists idx_otp_destination_purpose on public.otp_store(destination,purpose,expires_at desc);
