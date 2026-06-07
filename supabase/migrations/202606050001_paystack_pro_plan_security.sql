-- Paystack pro-plan activations with RLS enabled for all new tables.
create table if not exists public.pro_plan_activations (
  id uuid primary key default gen_random_uuid(),
  kind text not null check (kind in ('home', 'vendor')),
  provider text not null default 'paystack' check (provider = 'paystack'),
  reference text not null unique,
  payer_email text not null,
  organization_name text not null,
  amount numeric(12,2) not null default 0,
  currency text not null default 'KES',
  paid_at timestamptz not null,
  expires_at timestamptz not null,
  reminder_at timestamptz not null,
  reminder_sent_at timestamptz,
  status text not null default 'active' check (status in ('active', 'ended', 'cancelled')),
  raw_event jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.pro_plan_activations enable row level security;

create index if not exists pro_plan_activations_payer_email_idx on public.pro_plan_activations (lower(payer_email));
create index if not exists pro_plan_activations_expiry_idx on public.pro_plan_activations (status, expires_at);
create index if not exists pro_plan_activations_reminder_idx on public.pro_plan_activations (status, reminder_at) where reminder_sent_at is null;

drop policy if exists "Users can read own pro plan activations" on public.pro_plan_activations;
create policy "Users can read own pro plan activations" on public.pro_plan_activations
  for select using (lower(payer_email) = lower(coalesce(auth.jwt() ->> 'email', '')));

drop policy if exists "Admins can read all pro plan activations" on public.pro_plan_activations;
create policy "Admins can read all pro plan activations" on public.pro_plan_activations
  for select using (
    exists (
      select 1 from public.user_profiles up
      where up.id = auth.uid()
        and (up.role = 'admin' or coalesce(up.is_admin, false) = true)
    )
  );

-- Only trusted server/service-role code inserts or mutates payment activation rows.
drop policy if exists "Service role manages pro plan activations" on public.pro_plan_activations;
create policy "Service role manages pro plan activations" on public.pro_plan_activations
  for all using (auth.role() = 'service_role') with check (auth.role() = 'service_role');

-- Ensure important existing tables keep RLS on when this migration runs.
do $$
declare
  table_name text;
begin
  foreach table_name in array array[
    'user_profiles', 'payments', 'notifications', 'push_subscriptions', 'erp_staff',
    'erp_tasks', 'erp_cases', 'erp_messages', 'vendor_bookings', 'vendor_tasks',
    'vendor_inventory_items', 'vendor_staff', 'subscription_payment_requests'
  ] loop
    if to_regclass('public.' || table_name) is not null then
      execute format('alter table public.%I enable row level security', table_name);
    end if;
  end loop;
end $$;
