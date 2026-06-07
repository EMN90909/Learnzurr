create table if not exists public.funeral_home_inventory (
  id uuid primary key default gen_random_uuid(),
  home_id uuid not null,
  item_name text not null,
  category text not null check (category in ('Consumables', 'Reusable equipment', 'High-value stock', 'Per-case stock', 'General stock')),
  sku text,
  unit_of_measure text default 'unit',
  cost_price numeric(12,2) default 0,
  selling_price numeric(12,2) default 0,
  quantity_in_stock integer default 0,
  minimum_stock_level integer default 0,
  reorder_level integer default 0,
  supplier text,
  item_type text default 'consumable',
  reusable boolean default false,
  active boolean default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.user_profiles add column if not exists home_name text;
alter table public.user_profiles add column if not exists is_home boolean default false;
alter table public.user_profiles add column if not exists phone text;
alter table public.user_profiles add column if not exists address text;
alter table public.user_profiles add column if not exists contact_person text;
alter table public.user_profiles add column if not exists active boolean default true;
alter table public.user_profiles add column if not exists updated_at timestamptz default now();

drop policy if exists "Authenticated users can find active funeral homes" on public.user_profiles;
create policy "Authenticated users can find active funeral homes" on public.user_profiles
  for select using (auth.role() = 'authenticated' and is_home = true and role = 'operations' and active = true);

create table if not exists public.funeral_cases (
  id uuid primary key default gen_random_uuid(),
  home_id uuid not null,
  family_user_id uuid,
  deceased_name text not null,
  family_contact_name text,
  family_contact_phone text,
  service_date date,
  county text,
  town text,
  status text default 'Requested',
  notes text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.subscriptions (
  id uuid primary key default gen_random_uuid(),
  home_id uuid not null,
  plan_name text default 'Funeral Home Professional',
  amount numeric(12,2) default 10,
  currency text default 'USD',
  status text default 'inactive',
  payment_provider text,
  started_at timestamptz,
  expires_at timestamptz,
  created_at timestamptz default now()
);

create table if not exists public.payments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid,
  home_id uuid,
  provider text not null,
  amount numeric(12,2) not null,
  currency text default 'USD',
  status text default 'pending',
  reference text,
  checkout_request_id text,
  paid_at timestamptz,
  created_at timestamptz default now()
);

create table if not exists public.vendor_items (
  id uuid primary key default gen_random_uuid(),
  vendor_id uuid not null,
  item_name text not null,
  category text not null,
  description text,
  sku text,
  quantity_total integer default 0,
  quantity_available integer default 0,
  unit_price numeric(12,2) default 0,
  pricing_unit text default 'per day',
  reusable boolean default true,
  requires_delivery boolean default true,
  requires_setup boolean default false,
  active boolean default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.vendor_bookings (
  id uuid primary key default gen_random_uuid(),
  vendor_id uuid not null,
  home_id uuid,
  family_user_id uuid,
  case_id uuid,
  category text,
  status text default 'Requested',
  payment_status text default 'unpaid',
  payment_method text,
  delivery_date date,
  setup_date date,
  collection_date date,
  notes text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.vendor_item_bookings (
  id uuid primary key default gen_random_uuid(),
  vendor_id uuid not null,
  item_id uuid not null,
  case_id uuid,
  booking_id uuid,
  quantity integer not null default 1,
  status text default 'Requested',
  delivery_date date,
  setup_date date,
  collection_date date,
  created_at timestamptz default now()
);

create table if not exists public.vendor_item_maintenance (
  id uuid primary key default gen_random_uuid(),
  vendor_id uuid not null,
  item_id uuid not null,
  quantity integer not null default 1,
  reason text,
  status text default 'Open',
  notes text,
  created_at timestamptz default now()
);

alter table public.funeral_home_inventory enable row level security;
alter table public.funeral_cases enable row level security;
alter table public.subscriptions enable row level security;
alter table public.payments enable row level security;
alter table public.vendor_items enable row level security;
alter table public.vendor_bookings enable row level security;
alter table public.vendor_item_bookings enable row level security;
alter table public.vendor_item_maintenance enable row level security;

drop policy if exists "Owners manage funeral home inventory" on public.funeral_home_inventory;
create policy "Owners manage funeral home inventory" on public.funeral_home_inventory
  for all using (auth.uid() = home_id) with check (auth.uid() = home_id);
drop policy if exists "Homes manage cases" on public.funeral_cases;
create policy "Homes manage cases" on public.funeral_cases
  for all using (auth.uid() = home_id or auth.uid() = family_user_id) with check (auth.uid() = home_id or auth.uid() = family_user_id);
drop policy if exists "Homes read subscriptions" on public.subscriptions;
create policy "Homes read subscriptions" on public.subscriptions
  for all using (auth.uid() = home_id) with check (auth.uid() = home_id);
drop policy if exists "Users read payments" on public.payments;
create policy "Users read payments" on public.payments
  for all using (auth.uid() = user_id or auth.uid() = home_id) with check (auth.uid() = user_id or auth.uid() = home_id);
drop policy if exists "Vendors manage items" on public.vendor_items;
create policy "Vendors manage items" on public.vendor_items
  for all using (auth.uid() = vendor_id) with check (auth.uid() = vendor_id);
drop policy if exists "Related users manage vendor bookings" on public.vendor_bookings;
create policy "Related users manage vendor bookings" on public.vendor_bookings
  for all using (auth.uid() = vendor_id or auth.uid() = home_id or auth.uid() = family_user_id)
  with check (auth.uid() = vendor_id or auth.uid() = home_id or auth.uid() = family_user_id);
drop policy if exists "Vendors manage item bookings" on public.vendor_item_bookings;
create policy "Vendors manage item bookings" on public.vendor_item_bookings
  for all using (auth.uid() = vendor_id) with check (auth.uid() = vendor_id);
drop policy if exists "Vendors manage maintenance" on public.vendor_item_maintenance;
create policy "Vendors manage maintenance" on public.vendor_item_maintenance
  for all using (auth.uid() = vendor_id) with check (auth.uid() = vendor_id);
