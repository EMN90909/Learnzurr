-- Vendor ERP: paid vendor-only bookings, inventory, staff tasks, booking chat, realtime-friendly indexes.

alter table public.user_profiles
  add column if not exists vendor_erp_enabled boolean default false,
  add column if not exists erp_type text default null;

create table if not exists public.vendor_inventory_items (
  id uuid primary key default gen_random_uuid(),
  vendor_id uuid not null references auth.users(id) on delete cascade,
  item_name text not null,
  category text not null default 'equipment',
  description text,
  quantity_total integer not null default 0,
  quantity_available integer not null default 0,
  unit_price numeric(12,2) not null default 0,
  currency text not null default 'KES',
  condition text not null default 'good',
  active boolean not null default true,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.vendor_bookings (
  id uuid primary key default gen_random_uuid(),
  vendor_id uuid not null references auth.users(id) on delete cascade,
  created_by uuid references auth.users(id) on delete set null,
  family_name text not null,
  family_phone text,
  family_email text,
  event_type text not null default 'funeral_service',
  event_date timestamptz,
  pickup_location text,
  destination_location text,
  equipment_needed jsonb not null default '[]'::jsonb,
  services_needed jsonb not null default '[]'::jsonb,
  notes text,
  status text not null default 'pending',
  total_amount numeric(12,2) not null default 0,
  currency text not null default 'KES',
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.vendor_booking_tasks (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid not null references public.vendor_bookings(id) on delete cascade,
  vendor_id uuid not null references auth.users(id) on delete cascade,
  assigned_to uuid references auth.users(id) on delete set null,
  assigned_by uuid references auth.users(id) on delete set null,
  role text not null default 'staff',
  title text not null,
  description text,
  status text not null default 'pending',
  due_at timestamptz,
  started_at timestamptz,
  completed_at timestamptz,
  notes text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.vendor_booking_messages (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid not null references public.vendor_bookings(id) on delete cascade,
  vendor_id uuid not null references auth.users(id) on delete cascade,
  sender_id uuid not null references auth.users(id) on delete cascade,
  body text not null,
  attachment_url text,
  attachment_name text,
  seen_by jsonb not null default '[]'::jsonb,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

alter table public.vendor_inventory_items enable row level security;
alter table public.vendor_bookings enable row level security;
alter table public.vendor_booking_tasks enable row level security;
alter table public.vendor_booking_messages enable row level security;

create index if not exists idx_vendor_inventory_vendor_active on public.vendor_inventory_items(vendor_id, active, category);
create index if not exists idx_vendor_bookings_vendor_status_date on public.vendor_bookings(vendor_id, status, event_date desc);
create index if not exists idx_vendor_bookings_created on public.vendor_bookings(created_at desc);
create index if not exists idx_vendor_tasks_vendor_status on public.vendor_booking_tasks(vendor_id, status, created_at desc);
create index if not exists idx_vendor_tasks_assigned on public.vendor_booking_tasks(assigned_to, status, created_at desc);
create index if not exists idx_vendor_messages_booking_created on public.vendor_booking_messages(booking_id, created_at desc);

-- RLS is intentionally conservative for direct client access. Server service-role APIs enforce paid plan and role permissions.
drop policy if exists "Vendor owners read their inventory" on public.vendor_inventory_items;
create policy "Vendor owners read their inventory" on public.vendor_inventory_items for select using (vendor_id = auth.uid());

drop policy if exists "Vendor owners read their bookings" on public.vendor_bookings;
create policy "Vendor owners read their bookings" on public.vendor_bookings for select using (vendor_id = auth.uid());

drop policy if exists "Vendor staff read assigned tasks" on public.vendor_booking_tasks;
create policy "Vendor staff read assigned tasks" on public.vendor_booking_tasks for select using (vendor_id = auth.uid() or assigned_to = auth.uid());

drop policy if exists "Vendor staff read booking messages" on public.vendor_booking_messages;
create policy "Vendor staff read booking messages" on public.vendor_booking_messages for select using (vendor_id = auth.uid() or sender_id = auth.uid());

do $$ begin alter publication supabase_realtime add table public.vendor_bookings; exception when duplicate_object then null; end $$;
do $$ begin alter publication supabase_realtime add table public.vendor_booking_tasks; exception when duplicate_object then null; end $$;
do $$ begin alter publication supabase_realtime add table public.vendor_booking_messages; exception when duplicate_object then null; end $$;
do $$ begin alter publication supabase_realtime add table public.vendor_inventory_items; exception when duplicate_object then null; end $$;
