
-- Learnzur performance configuration and observability tables.
create table if not exists performance_profiles (
  id uuid primary key default gen_random_uuid(),
  scope text not null check (scope in ('backend','frontend','engine','database','worker')),
  name text not null,
  config jsonb not null default '{}'::jsonb,
  enabled boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(scope, name)
);

create table if not exists performance_events (
  id uuid primary key default gen_random_uuid(),
  scope text not null,
  route text,
  duration_ms integer not null check (duration_ms >= 0),
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

alter table performance_profiles enable row level security;
alter table performance_events enable row level security;

drop policy if exists "Admins manage performance profiles" on performance_profiles;
create policy "Admins manage performance profiles" on performance_profiles
  using (true) with check (true);

drop policy if exists "Service writes performance events" on performance_events;
create policy "Service writes performance events" on performance_events
  for insert with check (true);

create index if not exists idx_performance_profiles_scope on performance_profiles(scope, enabled);
create index if not exists idx_performance_events_scope_time on performance_events(scope, created_at desc);

insert into performance_profiles(scope, name, config) values
('backend','http-server','{"timeouts":true,"serveMux":true,"gzip":true,"bodyLimit":"10MB"}'::jsonb),
('frontend','sveltekit-ssr','{"ssr":true,"minify":true,"lazyStudio":true,"seoHead":true}'::jsonb),
('engine','redis-cache','{"namespaced":true,"streams":true,"batchJobs":true}'::jsonb)
on conflict(scope, name) do update set config = excluded.config, updated_at = now();

alter publication supabase_realtime add table performance_events;
