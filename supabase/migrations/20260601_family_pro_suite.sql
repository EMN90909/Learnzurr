create table if not exists public.family_pro_assets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  asset_type text not null check (asset_type in ('eulogy', 'banner', 'social_post', 'private_link')),
  title text not null,
  content text not null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.family_pro_checklist_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  title text not null,
  due_date date null,
  completed boolean not null default false,
  priority text not null default 'normal' check (priority in ('low', 'normal', 'high')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.family_pro_reminders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  title text not null,
  remind_at timestamptz not null,
  channel text not null default 'email' check (channel in ('email', 'sms', 'whatsapp')),
  sent_at timestamptz null,
  created_at timestamptz not null default now()
);

create table if not exists public.family_private_memorials (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  memorial_id uuid null,
  title text not null,
  private_slug text not null unique,
  password_hash text not null,
  hint text null,
  is_enabled boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.family_private_links (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  memorial_id uuid null,
  title text not null,
  token text not null unique,
  expires_at timestamptz null,
  max_views integer null,
  views integer not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists public.family_pro_uploads (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  memorial_id uuid null,
  file_name text not null,
  file_url text not null,
  mime_type text not null,
  size_bytes bigint not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists public.family_priority_support_tickets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  subject text not null,
  message text not null,
  status text not null default 'priority_open' check (status in ('priority_open', 'in_progress', 'resolved')),
  priority text not null default 'high',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.family_pro_assets enable row level security;
alter table public.family_pro_checklist_items enable row level security;
alter table public.family_pro_reminders enable row level security;
alter table public.family_private_memorials enable row level security;
alter table public.family_private_links enable row level security;
alter table public.family_pro_uploads enable row level security;
alter table public.family_priority_support_tickets enable row level security;

drop policy if exists family_pro_assets_owner on public.family_pro_assets;
create policy family_pro_assets_owner on public.family_pro_assets for all to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);
drop policy if exists family_pro_checklist_owner on public.family_pro_checklist_items;
create policy family_pro_checklist_owner on public.family_pro_checklist_items for all to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);
drop policy if exists family_pro_reminders_owner on public.family_pro_reminders;
create policy family_pro_reminders_owner on public.family_pro_reminders for all to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);
drop policy if exists family_private_memorials_owner on public.family_private_memorials;
create policy family_private_memorials_owner on public.family_private_memorials for all to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);
drop policy if exists family_private_links_owner on public.family_private_links;
create policy family_private_links_owner on public.family_private_links for all to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);
drop policy if exists family_pro_uploads_owner on public.family_pro_uploads;
create policy family_pro_uploads_owner on public.family_pro_uploads for all to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);
drop policy if exists family_priority_support_owner on public.family_priority_support_tickets;
create policy family_priority_support_owner on public.family_priority_support_tickets for all to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);

create index if not exists family_pro_assets_user_idx on public.family_pro_assets(user_id, created_at desc);
create index if not exists family_pro_checklist_user_idx on public.family_pro_checklist_items(user_id, completed, due_date);
create index if not exists family_pro_reminders_user_idx on public.family_pro_reminders(user_id, remind_at);
create index if not exists family_private_links_token_idx on public.family_private_links(token);
create index if not exists family_priority_support_user_idx on public.family_priority_support_tickets(user_id, created_at desc);