create table if not exists public.mpesa_callbacks (id uuid primary key default gen_random_uuid(), checkout_request_id text unique, merchant_request_id text, result_code text, result_description text, raw_payload jsonb not null, processed_at timestamptz, created_at timestamptz not null default now());
alter table public.mpesa_callbacks enable row level security;
