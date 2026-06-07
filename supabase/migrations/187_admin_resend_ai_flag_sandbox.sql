-- Learnzur admin, Resend email, AI provider, and chat sandbox moderation setup.
create table if not exists admin_portal_access (
  id uuid primary key default gen_random_uuid(),
  email text not null unique,
  role text not null default 'super_admin' check (role in ('super_admin','admin','moderator')),
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
insert into admin_portal_access(email, role, active)
values ('nasongoemmanuel8@gmail.com', 'super_admin', true)
on conflict (email) do update set role = excluded.role, active = true, updated_at = now();
alter table admin_portal_access enable row level security;
drop policy if exists "admin portal is service-role managed" on admin_portal_access;
create policy "admin portal is service-role managed" on admin_portal_access for all using (false) with check (false);

create table if not exists ai_provider_config (
  id uuid primary key default gen_random_uuid(),
  provider text not null check (provider in ('gemini','openrouter','deepseek')),
  model text not null,
  enabled boolean not null default true,
  priority int not null default 10,
  created_at timestamptz not null default now()
);
insert into ai_provider_config(provider, model, enabled, priority) values
('gemini','gemini-1.5-flash',true,1),
('openrouter','deepseek/deepseek-chat',true,2),
('deepseek','deepseek-chat',true,3)
on conflict do nothing;
alter table ai_provider_config enable row level security;
create policy "ai config service role only" on ai_provider_config for all using (false) with check (false);

create table if not exists flag_chat_sandbox (
  id uuid primary key default gen_random_uuid(),
  room_id text not null,
  user_id text not null,
  message text not null,
  sanitized_message text not null,
  provider text not null,
  severity text not null check (severity in ('clear','low','medium','high','critical')),
  allowed boolean not null default false,
  banned boolean not null default false,
  reason text not null,
  created_at timestamptz not null default now()
);
create index if not exists idx_flag_chat_sandbox_user on flag_chat_sandbox(user_id, created_at desc);
create index if not exists idx_flag_chat_sandbox_room on flag_chat_sandbox(room_id, created_at desc);
alter table flag_chat_sandbox enable row level security;
create policy "flag sandbox admin service only" on flag_chat_sandbox for all using (false) with check (false);

create table if not exists banned_users (
  id uuid primary key default gen_random_uuid(),
  user_id text not null unique,
  reason text not null,
  source text not null default 'flag_chat_sandbox',
  active boolean not null default true,
  created_at timestamptz not null default now()
);
alter table banned_users enable row level security;
create policy "banned users service only" on banned_users for all using (false) with check (false);

create table if not exists resend_email_events (
  id uuid primary key default gen_random_uuid(),
  recipient text not null,
  subject text not null,
  status text not null,
  provider text not null default 'resend',
  created_at timestamptz not null default now()
);
alter table resend_email_events enable row level security;
create policy "resend events service only" on resend_email_events for all using (false) with check (false);

alter publication supabase_realtime add table flag_chat_sandbox;
