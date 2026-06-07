create extension if not exists pgcrypto;

grant usage on schema public to anon, authenticated;
grant select on all tables in schema public to anon;
grant select, insert, update, delete on all tables in schema public to authenticated;
grant usage, select on all sequences in schema public to anon, authenticated;

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
alter table public.subscriptions add column if not exists paypal_subscription_id text;
alter table public.subscriptions add column if not exists current_period_start timestamptz;
alter table public.subscriptions add column if not exists current_period_end timestamptz;
alter table public.subscriptions add column if not exists raw_subscription jsonb default '{}'::jsonb;
alter table public.subscriptions add column if not exists updated_at timestamptz not null default now();
alter table public.subscriptions alter column created_at set default now();

create unique index if not exists subscriptions_paypal_subscription_id_uidx
  on public.subscriptions(paypal_subscription_id)
  where paypal_subscription_id is not null;

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

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'payments_invoice_id_fkey'
      and conrelid = 'public.payments'::regclass
  ) then
    alter table public.payments
      add constraint payments_invoice_id_fkey
      foreign key (invoice_id) references public.invoices(id) on delete set null;
  end if;
end $$;

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

alter table public.notifications add column if not exists type text not null default 'request';
alter table public.notifications add column if not exists entity_type text;
alter table public.notifications add column if not exists entity_id text;
alter table public.notifications add column if not exists deep_link text;
alter table public.notifications add column if not exists idempotency_key text;
update public.notifications
set idempotency_key = coalesce(idempotency_key, id::text)
where idempotency_key is null;
alter table public.notifications alter column idempotency_key set not null;
create unique index if not exists notifications_idempotency_key_uidx on public.notifications(idempotency_key);

alter table public.memorial_pages add column if not exists harambee_enabled boolean default false;
alter table public.memorial_pages add column if not exists harambee_target numeric default 0;
alter table public.memorial_pages add column if not exists harambee_contributed numeric default 0;
alter table public.memorial_pages add column if not exists harambee_contributors_count integer default 0;
alter table public.memorial_pages add column if not exists whatsapp_group_link text;

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
create index if not exists subscriptions_vendor_created_idx on public.subscriptions(vendor_id, created_at desc);
create index if not exists notifications_user_created_idx on public.notifications(user_id, created_at desc);
create index if not exists payments_user_created_idx on public.payments(user_id, created_at desc);
create index if not exists payments_provider_created_idx on public.payments(provider_id, created_at desc);
create index if not exists payments_home_created_idx on public.payments(home_id, created_at desc);
create index if not exists payments_vendor_created_idx on public.payments(vendor_id, created_at desc);
create index if not exists payments_invoice_idx on public.payments(invoice_id);
create index if not exists payments_request_idx on public.payments(request_id);
create index if not exists payments_subscription_idx on public.payments(subscription_id);
create index if not exists activity_logs_user_idx on public.activity_logs(user_id);
create index if not exists activity_logs_actor_user_idx on public.activity_logs(actor_user_id);
create index if not exists disputes_payment_idx on public.disputes(payment_id);
create index if not exists invoices_user_idx on public.invoices(user_id);
create index if not exists invoices_provider_idx on public.invoices(provider_id);
create index if not exists refunds_payment_idx on public.refunds(payment_id);
create index if not exists refunds_requested_by_idx on public.refunds(requested_by);
create index if not exists bookings_home_idx on public.bookings(home_id);
create index if not exists bookings_request_idx on public.bookings(request_id);
create index if not exists condolences_memorial_page_idx on public.condolences(memorial_page_id);
create index if not exists erp_home_idx on public.erp_staff(home_id);
create index if not exists erp_staff_user_idx on public.erp_staff(user_id);
create index if not exists erp_maintenance_home_idx on public.erp_maintenance(home_id);
create index if not exists erp_maintenance_checked_by_idx on public.erp_maintenance(checked_by);
create index if not exists erp_requests_home_idx on public.erp_requests(home_id);
create index if not exists erp_requests_assigned_to_idx on public.erp_requests(assigned_to);
create index if not exists erp_requests_approved_by_idx on public.erp_requests(approved_by);
create index if not exists erp_tasks_home_idx on public.erp_tasks(home_id);
create index if not exists erp_tasks_request_idx on public.erp_tasks(request_id);
create index if not exists erp_tasks_assigned_to_idx on public.erp_tasks(assigned_to);
create index if not exists erp_messages_home_idx on public.erp_messages(home_id);
create index if not exists erp_messages_request_idx on public.erp_messages(request_id);
create index if not exists erp_messages_task_idx on public.erp_messages(task_id);
create index if not exists erp_messages_sender_idx on public.erp_messages(sender_id);
create index if not exists erp_schedules_home_idx on public.erp_schedules(home_id);
create index if not exists erp_schedule_staff_schedule_idx on public.erp_schedule_staff(schedule_id);
create index if not exists erp_schedule_staff_staff_idx on public.erp_schedule_staff(staff_id);
create index if not exists erp_transport_home_idx on public.erp_transport(home_id);
create index if not exists erp_transport_driver_idx on public.erp_transport(driver_id);
create index if not exists funeral_home_inventory_home_idx on public.funeral_home_inventory(home_id);
create index if not exists group_members_group_idx on public.group_members(group_id);
create index if not exists harambees_memorial_page_idx on public.harambees(memorial_page_id);
create index if not exists home_subscriptions_home_idx on public.home_subscriptions(home_id);
create index if not exists homes_owner_user_idx on public.homes(owner_user_id);
create index if not exists memorial_requests_home_idx on public.memorial_requests(home_id);
create index if not exists memorial_comments_memorial_idx on public.memorial_comments(memorial_id);
create index if not exists memorial_comments_user_idx on public.memorial_comments(user_id);
create index if not exists memorial_pages_home_idx on public.memorial_pages(home_id);
create index if not exists memorial_pages_request_idx on public.memorial_pages(request_id);
create index if not exists memorial_pages_user_idx on public.memorial_pages(user_id);
create index if not exists user_settings_user_idx on public.user_settings(user_id);
create index if not exists vendor_services_vendor_idx on public.vendor_services(vendor_id);
create index if not exists vendor_subscriptions_vendor_idx on public.vendor_subscriptions(vendor_id);
create index if not exists vendor_item_bookings_request_idx on public.vendor_item_bookings(request_id);
create index if not exists vendor_item_bookings_vendor_idx on public.vendor_item_bookings(vendor_id);
create index if not exists vendor_item_bookings_item_idx on public.vendor_item_bookings(item_id);
create index if not exists vendor_items_vendor_idx on public.vendor_items(vendor_id);

alter table public.service_requests enable row level security;
alter table public.invoices enable row level security;
alter table public.notifications enable row level security;
alter table public.activity_logs enable row level security;
alter table public.paypal_webhook_events enable row level security;
alter table public.refunds enable row level security;
alter table public.disputes enable row level security;
alter table public.subscriptions enable row level security;
alter table public.payments enable row level security;

drop policy if exists "service_requests_insert" on public.service_requests;
drop policy if exists "service_requests_select" on public.service_requests;
drop policy if exists "service_requests_update" on public.service_requests;

create policy "Service requests select related" on public.service_requests
  for select to authenticated
  using (requester_id = (select auth.uid()) or provider_id = (select auth.uid()));

create policy "Service requests insert own" on public.service_requests
  for insert to authenticated
  with check (requester_id = (select auth.uid()));

create policy "Service requests update related" on public.service_requests
  for update to authenticated
  using (requester_id = (select auth.uid()) or provider_id = (select auth.uid()))
  with check (requester_id = (select auth.uid()) or provider_id = (select auth.uid()));

drop policy if exists "Subscriptions access" on public.subscriptions;
drop policy if exists "Subscriptions insert self" on public.subscriptions;
drop policy if exists "Subscriptions update self" on public.subscriptions;
create policy "Subscriptions select related" on public.subscriptions
  for select to authenticated
  using (user_id = (select auth.uid()) or provider_id = (select auth.uid()) or home_id = (select auth.uid()) or vendor_id = (select auth.uid()));
create policy "Subscriptions insert related" on public.subscriptions
  for insert to authenticated
  with check (user_id = (select auth.uid()) or provider_id = (select auth.uid()) or home_id = (select auth.uid()) or vendor_id = (select auth.uid()));
create policy "Subscriptions update related" on public.subscriptions
  for update to authenticated
  using (user_id = (select auth.uid()) or provider_id = (select auth.uid()) or home_id = (select auth.uid()) or vendor_id = (select auth.uid()))
  with check (user_id = (select auth.uid()) or provider_id = (select auth.uid()) or home_id = (select auth.uid()) or vendor_id = (select auth.uid()));

drop policy if exists "Payments access" on public.payments;
create policy "Payments select related" on public.payments
  for select to authenticated
  using (user_id = (select auth.uid()) or provider_id = (select auth.uid()) or home_id = (select auth.uid()) or vendor_id = (select auth.uid()));

drop policy if exists "Notifications read own" on public.notifications;
drop policy if exists "Notifications update own" on public.notifications;
drop policy if exists "Notifications insert own" on public.notifications;
create policy "Notifications read own" on public.notifications
  for select to authenticated using (user_id = (select auth.uid()));
create policy "Notifications update own" on public.notifications
  for update to authenticated using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
create policy "Notifications insert own" on public.notifications
  for insert to authenticated with check (user_id = (select auth.uid()));
create policy "Notifications delete own" on public.notifications
  for delete to authenticated using (user_id = (select auth.uid()));

drop policy if exists "Invoices related access" on public.invoices;
create policy "Invoices related access" on public.invoices
  for all to authenticated
  using (user_id = (select auth.uid()) or provider_id = (select auth.uid()) or exists (select 1 from public.user_profiles up where up.id = (select auth.uid()) and up.role = 'admin'))
  with check (user_id = (select auth.uid()) or provider_id = (select auth.uid()) or exists (select 1 from public.user_profiles up where up.id = (select auth.uid()) and up.role = 'admin'));

drop policy if exists "Activity logs read related" on public.activity_logs;
create policy "Activity logs read related" on public.activity_logs
  for select to authenticated
  using (user_id = (select auth.uid()) or actor_user_id = (select auth.uid()) or exists (select 1 from public.user_profiles up where up.id = (select auth.uid()) and up.role = 'admin'));

drop policy if exists "Webhook events admin only" on public.paypal_webhook_events;
create policy "Webhook events admin only" on public.paypal_webhook_events
  for select to authenticated
  using (exists (select 1 from public.user_profiles up where up.id = (select auth.uid()) and up.role = 'admin'));

drop policy if exists "Refunds related access" on public.refunds;
create policy "Refunds related access" on public.refunds
  for select to authenticated
  using (
    requested_by = (select auth.uid())
    or exists (
      select 1 from public.payments p
      where p.id = payment_id
        and (p.user_id = (select auth.uid()) or p.provider_id = (select auth.uid()) or p.home_id = (select auth.uid()) or p.vendor_id = (select auth.uid()))
    )
    or exists (select 1 from public.user_profiles up where up.id = (select auth.uid()) and up.role = 'admin')
  );

drop policy if exists "Disputes related access" on public.disputes;
create policy "Disputes related access" on public.disputes
  for select to authenticated
  using (
    exists (
      select 1 from public.payments p
      where p.id = payment_id
        and (p.user_id = (select auth.uid()) or p.provider_id = (select auth.uid()) or p.home_id = (select auth.uid()) or p.vendor_id = (select auth.uid()))
    )
    or exists (select 1 from public.user_profiles up where up.id = (select auth.uid()) and up.role = 'admin')
  );

drop policy if exists "Anyone can read memorial media" on storage.objects;

drop policy if exists "memorial_pages_insert_policy" on public.memorial_pages;
drop policy if exists "memorial_pages_update_policy" on public.memorial_pages;
drop policy if exists "memorial_pages_select_policy" on public.memorial_pages;

drop policy if exists "Anyone can add condolence" on public.condolences;
create policy "Anyone can add condolence" on public.condolences
  for insert to anon, authenticated
  with check (
    memorial_page_id is not null
    and message is not null
    and length(trim(message)) > 0
    and exists (
      select 1 from public.memorial_pages mp
      where mp.id = memorial_page_id and coalesce(mp.is_public, false) = true
    )
  );

drop policy if exists "Anyone can contribute" on public.harambees;
create policy "Anyone can contribute" on public.harambees
  for insert to anon, authenticated
  with check (
    memorial_page_id is not null
    and amount > 0
    and exists (
      select 1 from public.memorial_pages mp
      where mp.id = memorial_page_id and coalesce(mp.harambee_enabled, false) = true
    )
  );

drop policy if exists "Bookings admin access" on public.bookings;
create policy "Bookings admin access" on public.bookings
  for all to authenticated
  using (exists (select 1 from public.user_profiles up where up.id = (select auth.uid()) and up.role = 'admin'))
  with check (exists (select 1 from public.user_profiles up where up.id = (select auth.uid()) and up.role = 'admin'));

drop policy if exists "ERP maintenance admin access" on public.erp_maintenance;
create policy "ERP maintenance admin access" on public.erp_maintenance
  for all to authenticated
  using (exists (select 1 from public.user_profiles up where up.id = (select auth.uid()) and up.role = 'admin'))
  with check (exists (select 1 from public.user_profiles up where up.id = (select auth.uid()) and up.role = 'admin'));

drop policy if exists "ERP messages related access" on public.erp_messages;
create policy "ERP messages related access" on public.erp_messages
  for all to authenticated
  using (sender_id = (select auth.uid()) or exists (select 1 from public.user_profiles up where up.id = (select auth.uid()) and up.role = 'admin'))
  with check (sender_id = (select auth.uid()) or exists (select 1 from public.user_profiles up where up.id = (select auth.uid()) and up.role = 'admin'));

drop policy if exists "ERP requests admin access" on public.erp_requests;
create policy "ERP requests admin access" on public.erp_requests
  for all to authenticated
  using (exists (select 1 from public.user_profiles up where up.id = (select auth.uid()) and up.role = 'admin'))
  with check (exists (select 1 from public.user_profiles up where up.id = (select auth.uid()) and up.role = 'admin'));

drop policy if exists "ERP schedule staff admin access" on public.erp_schedule_staff;
create policy "ERP schedule staff admin access" on public.erp_schedule_staff
  for all to authenticated
  using (exists (select 1 from public.user_profiles up where up.id = (select auth.uid()) and up.role = 'admin'))
  with check (exists (select 1 from public.user_profiles up where up.id = (select auth.uid()) and up.role = 'admin'));

drop policy if exists "ERP schedules admin access" on public.erp_schedules;
create policy "ERP schedules admin access" on public.erp_schedules
  for all to authenticated
  using (exists (select 1 from public.user_profiles up where up.id = (select auth.uid()) and up.role = 'admin'))
  with check (exists (select 1 from public.user_profiles up where up.id = (select auth.uid()) and up.role = 'admin'));

drop policy if exists "ERP tasks admin access" on public.erp_tasks;
create policy "ERP tasks admin access" on public.erp_tasks
  for all to authenticated
  using (exists (select 1 from public.user_profiles up where up.id = (select auth.uid()) and up.role = 'admin'))
  with check (exists (select 1 from public.user_profiles up where up.id = (select auth.uid()) and up.role = 'admin'));

drop policy if exists "ERP transport admin access" on public.erp_transport;
create policy "ERP transport admin access" on public.erp_transport
  for all to authenticated
  using (exists (select 1 from public.user_profiles up where up.id = (select auth.uid()) and up.role = 'admin'))
  with check (exists (select 1 from public.user_profiles up where up.id = (select auth.uid()) and up.role = 'admin'));

drop policy if exists "Group members admin access" on public.group_members;
create policy "Group members admin access" on public.group_members
  for all to authenticated
  using (exists (select 1 from public.user_profiles up where up.id = (select auth.uid()) and up.role = 'admin'))
  with check (exists (select 1 from public.user_profiles up where up.id = (select auth.uid()) and up.role = 'admin'));

drop policy if exists "Home subscriptions related access" on public.home_subscriptions;
create policy "Home subscriptions related access" on public.home_subscriptions
  for all to authenticated
  using (home_id = (select auth.uid()) or exists (select 1 from public.user_profiles up where up.id = (select auth.uid()) and up.role = 'admin'))
  with check (home_id = (select auth.uid()) or exists (select 1 from public.user_profiles up where up.id = (select auth.uid()) and up.role = 'admin'));

drop policy if exists "Memorial groups admin access" on public.memorial_groups;
create policy "Memorial groups admin access" on public.memorial_groups
  for all to authenticated
  using (exists (select 1 from public.user_profiles up where up.id = (select auth.uid()) and up.role = 'admin'))
  with check (exists (select 1 from public.user_profiles up where up.id = (select auth.uid()) and up.role = 'admin'));

drop policy if exists "Vendor services related access" on public.vendor_services;
create policy "Vendor services related access" on public.vendor_services
  for all to authenticated
  using (vendor_id = (select auth.uid()) or exists (select 1 from public.user_profiles up where up.id = (select auth.uid()) and up.role = 'admin'))
  with check (vendor_id = (select auth.uid()) or exists (select 1 from public.user_profiles up where up.id = (select auth.uid()) and up.role = 'admin'));

drop policy if exists "Vendor subscriptions related access" on public.vendor_subscriptions;
create policy "Vendor subscriptions related access" on public.vendor_subscriptions
  for all to authenticated
  using (vendor_id = (select auth.uid()) or exists (select 1 from public.user_profiles up where up.id = (select auth.uid()) and up.role = 'admin'))
  with check (vendor_id = (select auth.uid()) or exists (select 1 from public.user_profiles up where up.id = (select auth.uid()) and up.role = 'admin'));

drop policy if exists "Public read verified vendors" on public.vendors;
create policy "Public read verified vendors" on public.vendors
  for select to anon, authenticated
  using (coalesce(is_verified, false) = true and coalesce(status, 'active') in ('active', 'trialing', 'trial'));

drop policy if exists "Vendors update self" on public.vendors;
create policy "Vendors update self" on public.vendors
  for update to authenticated
  using (id = (select auth.uid()))
  with check (id = (select auth.uid()));

drop policy if exists "Vendors insert self" on public.vendors;
create policy "Vendors insert self" on public.vendors
  for insert to authenticated
  with check (id = (select auth.uid()));

do $$
begin
  if exists (
    select 1 from pg_proc p
    join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public' and p.proname = 'handle_new_user' and p.pronargs = 0
  ) then
    alter function public.handle_new_user() set search_path = public, auth;
    revoke execute on function public.handle_new_user() from public, anon, authenticated;
  end if;

  if exists (
    select 1 from pg_proc p
    join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public' and p.proname = 'set_updated_at' and p.pronargs = 0
  ) then
    alter function public.set_updated_at() set search_path = public;
  end if;
end $$;
