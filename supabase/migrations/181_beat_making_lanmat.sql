create table if not exists beat_projects (
  id uuid primary key default gen_random_uuid(),
  learner_id uuid references users(id) on delete cascade,
  title text not null check (char_length(title) between 2 and 120),
  tempo integer not null default 90 check (tempo between 40 and 220),
  license_type text not null default 'School project use',
  preview_url text,
  project_data jsonb not null default '{}'::jsonb,
  status text not null default 'draft',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table beat_projects enable row level security;
create policy beat_projects_owner_select on beat_projects for select using (auth.uid() = learner_id);
create policy beat_projects_owner_insert on beat_projects for insert with check (auth.uid() = learner_id);
create policy beat_projects_owner_update on beat_projects for update using (auth.uid() = learner_id) with check (auth.uid() = learner_id);
create index if not exists idx_beat_projects_learner_status on beat_projects(learner_id, status);
alter publication supabase_realtime add table beat_projects;
