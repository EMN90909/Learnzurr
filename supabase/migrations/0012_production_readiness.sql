create extension if not exists pgcrypto;

grant usage on schema public to anon, authenticated;
grant select, insert, update, delete on all tables in schema public to authenticated;
grant select on all tables in schema public to anon;
grant usage, select on all sequences in schema public to authenticated, anon;

create table if not exists public.service_requests (
  id uuid primary key default gen_random_uuid(),
  requester_id uuid references auth.users(id) on delete set null,
  requester_email text not null,
  provider_type text not null check (provider_type in ('home', 'vendor')),
  provider_id uuid not null references auth.users(id) on delete cascade,
  request_title text not null,
  request_details text not null,
  provider_name text,
  provider_offer text,
  provider_description text,
  notes text,
  status text not null default 'pending' check (status in ('pending', 'accepted', 'rejected', 'completed', 'cancelled')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.subscriptions add column if not exists user_id uuid references auth.users(id) on delete set null;
alter table public.subscriptions add column if not exists provider_id uuid references auth.users(id) on delete set null;
alter table public.subscriptions add column if not exists payment_status text default 'pending';
alter table public.subscriptions add column if not exists is_trial boolean default false;
alter table public.subscriptions add column if not exists trial_used boolean default false;
alter table public.subscriptions add column if not exists trial_days integer default 0;
alter table public.subscriptions add column if not exists trial_started_at timestamptz;
alter table public.subscriptions add column if not exists trial_ends_at timestamptz;
alter table public.subscriptions add column if not exists trial_7_day_notice_sent_at timestamptz;
alter table public.subscriptions add column if not exists trial_3_day_notice_sent_at timestamptz;
alter table public.subscriptions add column if not exists trial_1_day_notice_sent_at timestamptz;
alter table public.subscriptions add column if not exists trial_expired_notice_sent_at timestamptz;
alter table public.subscriptions add column if not exists paypal_plan_id text;
alter table public.subscriptions add column if not exists paypal_subscription_id text unique;
alter table public.subscriptions add column if not exists current_period_start timestamptz;
alter table public.subscriptions add column if not exists current_period_end timestamptz;
alter table public.subscriptions add column if not exists raw_subscription jsonb default '{}'::jsonb;
alter table public.subscriptions add column if not exists updated_at timestamptz not null default now();
alter table public.subscriptions add column if not exists created_at timestamptz not null default now();

alter table public.payments add column if not exists provider_id uuid references auth.users(id) on delete set null;
alter table public.payments add column if not exists provider_type text check (provider_type in ('home', 'vendor'));
alter table public.payments add column if not exists request_id uuid references public.service_requests(id) on delete set null;
alter table public.payments add column if not exists invoice_id uuid;
alter table public.payments add column if not exists subscription_id uuid references public.subscriptions(id) on delete set null;
alter table public.payments add column if not exists payer_email text;
alter table public.payments add column if not exists paypal_order_id text;
alter table public.payments add column if not exists paypal_capture_id text;
alter table public.payments add column if not exists raw_capture jsonb default '{}'::jsonb;
alter table public.payments add column if not exists metadata jsonb default '{}'::jsonb;
alter table public.payments add column if not exists updated_at timestamptz not null default now();

create table if not exists public.invoices (
  id uuid primary key default gen_random_uuid(),
  request_id uuid unique references public.service_requests(id) on delete cascade,
  payment_id uuid unique,
  user_id uuid references auth.users(id) on delete set null,
  provider_id uuid references auth.users(id) on delete set null,
  invoice_number text unique,
  title text not null,
  description text,
  amount numeric(12,2) not null default 0,
  currency text not null default 'USD',
  status text not null default 'draft' check (status in ('draft', 'pending', 'paid', 'failed', 'cancelled', 'refunded')),
  due_at timestamptz,
  paid_at timestamptz,
  email_sent_at timestamptz,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.payments
  add constraint payments_invoice_id_fkey
  foreign key (invoice_id) references public.invoices(id) on delete set null;

create table if not exists public.billing_plans (
  id uuid primary key default gen_random_uuid(),
  paypal_plan_id text not null unique,
  name text not null,
  description text,
  status text not null default 'created',
  raw_plan jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  type text not null,
  title text not null,
  body text not null,
  entity_type text,
  entity_id text,
  deep_link text,
  is_read boolean not null default false,
  idempotency_key text not null unique,
  created_at timestamptz not null default now()
);

create table if not exists public.activity_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,
  actor_user_id uuid references auth.users(id) on delete set null,
  entity_type text not null,
  entity_id text,
  action text not null,
  details jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.paypal_webhook_events (
  id uuid primary key default gen_random_uuid(),
  paypal_event_id text not null unique,
  transmission_id text not null,
  event_type text not null,
  resource_id text,
  status text not null default 'received' check (status in ('received', 'processing', 'processed', 'failed')),
  raw_event jsonb not null default '{}'::jsonb,
  processing_error text,
  created_time timestamptz,
  processed_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists public.refunds (
  id uuid primary key default gen_random_uuid(),
  payment_id uuid not null references public.payments(id) on delete cascade,
  paypal_capture_id text,
  paypal_refund_id text unique,
  requested_by uuid references auth.users(id) on delete set null,
  status text not null default 'pending' check (status in ('pending', 'completed', 'failed')),
  amount numeric(12,2) not null default 0,
  currency text not null default 'USD',
  reason text,
  raw_refund jsonb not null default '{}'::jsonb,
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.disputes (
  id uuid primary key default gen_random_uuid(),
  paypal_dispute_id text not null unique,
  payment_id uuid references public.payments(id) on delete set null,
  paypal_capture_id text,
  status text not null,
  reason text,
  raw_dispute jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists service_requests_provider_idx on public.service_requests(provider_id, created_at desc);
create index if not exists service_requests_requester_idx on public.service_requests(requester_id, created_at desc);
create index if not exists subscriptions_user_created_idx on public.subscriptions(user_id, created_at desc);
create index if not exists subscriptions_provider_created_idx on public.subscriptions(provider_id, created_at desc);
create index if not exists subscriptions_home_created_idx on public.subscriptions(home_id, created_at desc);
create index if not exists notifications_user_created_idx on public.notifications(user_id, created_at desc);
create index if not exists payments_user_created_idx on public.payments(user_id, created_at desc);
create index if not exists payments_provider_created_idx on public.payments(provider_id, created_at desc);
create index if not exists paypal_webhook_events_status_idx on public.paypal_webhook_events(status, created_at desc);

alter table public.service_requests enable row level security;
alter table public.invoices enable row level security;
alter table public.notifications enable row level security;
alter table public.activity_logs enable row level security;
alter table public.paypal_webhook_events enable row level security;
alter table public.refunds enable row level security;
alter table public.disputes enable row level security;
alter table public.subscriptions enable row level security;
alter table public.payments enable row level security;

drop policy if exists "Service requests access" on public.service_requests;
create policy "Service requests access" on public.service_requests
  for all to authenticated
  using (
    requester_id = auth.uid()
    or provider_id = auth.uid()
    or exists (
      select 1
      from public.user_profiles up
      where up.id = auth.uid() and up.role = 'admin'
    )
  )
  with check (
    requester_id = auth.uid()
    or provider_id = auth.uid()
    or exists (
      select 1
      from public.user_profiles up
      where up.id = auth.uid() and up.role = 'admin'
    )
  );

drop policy if exists "Invoices access" on public.invoices;
create policy "Invoices access" on public.invoices
  for all to authenticated
  using (
    user_id = auth.uid()
    or provider_id = auth.uid()
    or exists (
      select 1 from public.user_profiles up
      where up.id = auth.uid() and up.role = 'admin'
    )
  )
  with check (
    user_id = auth.uid()
    or provider_id = auth.uid()
    or exists (
      select 1 from public.user_profiles up
      where up.id = auth.uid() and up.role = 'admin'
    )
  );

drop policy if exists "Notifications read own" on public.notifications;
create policy "Notifications read own" on public.notifications
  for select to authenticated using (user_id = auth.uid());

drop policy if exists "Notifications update own" on public.notifications;
create policy "Notifications update own" on public.notifications
  for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

drop policy if exists "Notifications insert own" on public.notifications;
create policy "Notifications insert own" on public.notifications
  for insert to authenticated with check (user_id = auth.uid());

drop policy if exists "Activity logs access" on public.activity_logs;
create policy "Activity logs access" on public.activity_logs
  for select to authenticated
  using (
    user_id = auth.uid()
    or actor_user_id = auth.uid()
    or exists (
      select 1 from public.user_profiles up
      where up.id = auth.uid() and up.role = 'admin'
    )
  );

drop policy if exists "Subscriptions access" on public.subscriptions;
create policy "Subscriptions access" on public.subscriptions
  for all to authenticated
  using (
    user_id = auth.uid()
    or provider_id = auth.uid()
    or home_id = auth.uid()
    or exists (
      select 1 from public.user_profiles up
      where up.id = auth.uid() and up.role = 'admin'
    )
  )
  with check (
    user_id = auth.uid()
    or provider_id = auth.uid()
    or home_id = auth.uid()
    or exists (
      select 1 from public.user_profiles up
      where up.id = auth.uid() and up.role = 'admin'
    )
  );

drop policy if exists "Payments access" on public.payments;
create policy "Payments access" on public.payments
  for all to authenticated
  using (
    user_id = auth.uid()
    or provider_id = auth.uid()
    or home_id = auth.uid()
    or exists (
      select 1 from public.user_profiles up
      where up.id = auth.uid() and up.role = 'admin'
    )
  )
  with check (
    user_id = auth.uid()
    or provider_id = auth.uid()
    or home_id = auth.uid()
    or exists (
      select 1 from public.user_profiles up
      where up.id = auth.uid() and up.role = 'admin'
    )
  );

drop policy if exists "Refunds access" on public.refunds;
create policy "Refunds access" on public.refunds
  for select to authenticated
  using (
    exists (
      select 1
      from public.payments p
      where p.id = payment_id
        and (
          p.user_id = auth.uid()
          or p.provider_id = auth.uid()
          or p.home_id = auth.uid()
        )
    )
    or exists (
      select 1 from public.user_profiles up
      where up.id = auth.uid() and up.role = 'admin'
    )
  );

drop policy if exists "Disputes access" on public.disputes;
create policy "Disputes access" on public.disputes
  for select to authenticated
  using (
    exists (
      select 1
      from public.payments p
      where p.id = payment_id
        and (
          p.user_id = auth.uid()
          or p.provider_id = auth.uid()
          or p.home_id = auth.uid()
        )
    )
    or exists (
      select 1 from public.user_profiles up
      where up.id = auth.uid() and up.role = 'admin'
    )
  );

drop policy if exists "Webhook events admin only" on public.paypal_webhook_events;
create policy "Webhook events admin only" on public.paypal_webhook_events
  for select to authenticated
  using (
    exists (
      select 1 from public.user_profiles up
      where up.id = auth.uid() and up.role = 'admin'
    )
  );
