-- Learnzur security upload rules, audit helpers, and realtime tables.
create table if not exists upload_security_events (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid,
  filename text not null,
  sanitized_filename text not null,
  mime_type text not null,
  size_bytes bigint not null check (size_bytes <= 10485760),
  checksum_sha256 text not null,
  decision text not null check (decision in ('accepted','rejected')),
  reason text,
  created_at timestamptz not null default now()
);
alter table upload_security_events enable row level security;
drop policy if exists upload_security_events_admin_read on upload_security_events;
create policy upload_security_events_admin_read on upload_security_events for select using (auth.jwt() ->> 'role' = 'admin');

create table if not exists engine_security_profiles (
  id uuid primary key default gen_random_uuid(),
  engine text not null unique,
  redis_namespace text not null,
  max_upload_bytes bigint not null default 10485760,
  max_text_length int not null default 100,
  max_array_length int not null default 7,
  rate_limit_per_minute int not null default 100,
  updated_at timestamptz not null default now()
);
alter table engine_security_profiles enable row level security;
drop policy if exists engine_security_profiles_read on engine_security_profiles;
create policy engine_security_profiles_read on engine_security_profiles for select using (true);
insert into engine_security_profiles(engine, redis_namespace) values
('gamfy','learnzur:gamfy'),('mearn','learnzur:mearn'),('lms','learnzur:lms'),('classroom','learnzur:classroom'),('san','learnzur:san'),('lanmat','learnzur:lanmat'),('notify','learnzur:notify'),('media','learnzur:media'),('find','learnzur:find'),('flag','learnzur:flag')
on conflict(engine) do update set updated_at = now();
alter publication supabase_realtime add table upload_security_events;
