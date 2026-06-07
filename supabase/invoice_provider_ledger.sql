-- Struta invoice provider payment ledger.
-- Run after reliability_admin_payments.sql.

create extension if not exists pgcrypto;

alter table public.provider_payment_profiles add column if not exists paybill_number text;
alter table public.provider_payment_profiles add column if not exists account_number text;
alter table public.provider_payment_profiles add column if not exists paypal_email text;
alter table public.provider_payment_profiles add column if not exists stripe_account_id text;
alter table public.provider_payment_profiles add column if not exists settlement_currency text default 'KES';
alter table public.provider_payment_profiles add column if not exists is_verified boolean not null default false;

alter table public.invoices add column if not exists invoice_number text;
alter table public.invoices add column if not exists title text;
alter table public.invoices add column if not exists description text;
alter table public.invoices add column if not exists provider_type text;
alter table public.invoices add column if not exists selected_service jsonb;
alter table public.invoices add column if not exists provider_payment_destination jsonb;
alter table public.invoices add column if not exists ledger_status text not null default 'invoice_created';
create unique index if not exists idx_invoices_request_unique on public.invoices(request_id) where request_id is not null;

create table if not exists public.invoice_payment_ledger (
  id uuid primary key default gen_random_uuid(),
  invoice_id uuid references public.invoices(id) on delete set null,
  payment_id uuid references public.payments(id) on delete set null,
  request_id uuid,
  payer_user_id uuid,
  provider_id uuid not null,
  provider_type text,
  amount numeric(12,2) not null,
  currency text not null default 'KES',
  method text not null check (method in ('mobile_money_manual', 'mpesa_manual', 'paypal', 'stripe', 'paybill', 'till', 'phone')),
  direction text not null default 'payer_to_provider' check (direction in ('payer_to_provider', 'payer_to_struta', 'struta_to_provider', 'refund_to_payer')),
  source_account text,
  destination_type text,
  destination_account text,
  destination_name text,
  gateway_reference text,
  transaction_code text,
  status text not null default 'initiated' check (status in ('initiated', 'pending_verification', 'held', 'in_transit', 'settled', 'failed', 'reversed', 'refunded')),
  risk_flags jsonb not null default '{}'::jsonb,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  settled_at timestamptz
);

create index if not exists idx_invoice_ledger_invoice on public.invoice_payment_ledger(invoice_id);
create index if not exists idx_invoice_ledger_payment on public.invoice_payment_ledger(payment_id);
create index if not exists idx_invoice_ledger_provider on public.invoice_payment_ledger(provider_id);
create index if not exists idx_invoice_ledger_request on public.invoice_payment_ledger(request_id);
create index if not exists idx_invoice_ledger_status on public.invoice_payment_ledger(status);

create or replace function public.record_invoice_ledger_event(
  p_invoice_id uuid,
  p_payment_id uuid,
  p_request_id uuid,
  p_payer_user_id uuid,
  p_provider_id uuid,
  p_provider_type text,
  p_amount numeric,
  p_currency text,
  p_method text,
  p_direction text,
  p_destination_type text,
  p_destination_account text,
  p_destination_name text,
  p_gateway_reference text,
  p_transaction_code text,
  p_status text,
  p_metadata jsonb default '{}'::jsonb
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  ledger_id uuid;
begin
  insert into public.invoice_payment_ledger (
    invoice_id, payment_id, request_id, payer_user_id, provider_id, provider_type,
    amount, currency, method, direction, destination_type, destination_account,
    destination_name, gateway_reference, transaction_code, status, metadata,
    settled_at
  ) values (
    p_invoice_id, p_payment_id, p_request_id, p_payer_user_id, p_provider_id, p_provider_type,
    p_amount, coalesce(p_currency, 'KES'), p_method, coalesce(p_direction, 'payer_to_provider'),
    p_destination_type, p_destination_account, p_destination_name, p_gateway_reference,
    p_transaction_code, p_status, coalesce(p_metadata, '{}'::jsonb),
    case when p_status = 'settled' then now() else null end
  ) returning id into ledger_id;

  if p_invoice_id is not null then
    update public.invoices
    set ledger_status = p_status,
        updated_at = now()
    where id = p_invoice_id;
  end if;

  return ledger_id;
end;
$$;

grant execute on function public.record_invoice_ledger_event(uuid, uuid, uuid, uuid, uuid, text, numeric, text, text, text, text, text, text, text, text, text, jsonb) to authenticated, service_role;
