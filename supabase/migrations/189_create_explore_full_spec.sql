
-- Learnzur Create + Explore full spec tables and safety rules.
create table if not exists public.project_comments (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null,
  project_type text not null check (project_type in ('code','animation','movie','game','website-app','graphic-design','beat')),
  author_user_id uuid not null,
  message text not null check (char_length(message) <= 500),
  moderation_status text not null default 'pending',
  created_at timestamptz not null default now()
);
create table if not exists public.project_reports (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null,
  project_type text not null,
  reporter_user_id uuid not null,
  reason text not null check (char_length(reason) <= 500),
  status text not null default 'open',
  created_at timestamptz not null default now()
);
create table if not exists public.create_explore_rules (
  id uuid primary key default gen_random_uuid(),
  rule_group text not null check (rule_group in ('safety','speed','flow')),
  rule_text text not null,
  active boolean not null default true,
  created_at timestamptz not null default now()
);
insert into public.create_explore_rules (rule_group, rule_text) values
('safety','Private projects cannot appear in Explore.'),
('safety','Published projects must be scanned by Flag before public discovery.'),
('safety','Project comments must be scanned before display.'),
('safety','Code must run in an isolated sandbox with CPU, memory, timeout, and output limits.'),
('speed','Explore uses cursor pagination, thumbnails, cached popular projects, and mobile-friendly cards.'),
('speed','Animation and movie rendering jobs are queued and processed asynchronously.')
on conflict do nothing;
alter table public.project_comments enable row level security;
alter table public.project_reports enable row level security;
alter table public.create_explore_rules enable row level security;
create policy if not exists "public can read approved comments" on public.project_comments for select using (moderation_status = 'approved');
create policy if not exists "users can insert comments for scan" on public.project_comments for insert with check (true);
create policy if not exists "users can report projects" on public.project_reports for insert with check (true);
create policy if not exists "rules readable" on public.create_explore_rules for select using (active = true);
create index if not exists idx_project_comments_project on public.project_comments(project_type, project_id, created_at desc);
create index if not exists idx_project_reports_project on public.project_reports(project_type, project_id, created_at desc);
do $$ begin
  alter publication supabase_realtime add table public.project_comments;
exception when duplicate_object then null;
end $$;
