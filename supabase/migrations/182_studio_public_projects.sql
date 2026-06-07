create table if not exists studio_projects (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references users(id) on delete cascade,
  kind text not null check (kind in ('animation','game','website-app','graphic-design','beat','code','video','movie','storyboard')),
  title text not null,
  description text not null default '',
  age_mode text not null default '8-12' check (age_mode in ('8-12','13-18')),
  status text not null default 'draft' check (status in ('draft','review','published','blocked','archived')),
  visibility text not null default 'private' check (visibility in ('private','public')),
  lanmat_listing_id uuid,
  cover_asset_id uuid,
  preview_asset_id uuid,
  tool_state jsonb not null default '{}'::jsonb,
  public_slug text unique,
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_studio_projects_public on studio_projects(kind, published_at desc) where visibility = 'public' and status = 'published';
create index if not exists idx_studio_projects_owner on studio_projects(owner_id, updated_at desc);
alter table studio_projects enable row level security;

drop policy if exists studio_projects_owner_read on studio_projects;
create policy studio_projects_owner_read on studio_projects for select using (owner_id = auth.uid() or (visibility = 'public' and status = 'published'));

drop policy if exists studio_projects_owner_write on studio_projects;
create policy studio_projects_owner_write on studio_projects for all using (owner_id = auth.uid()) with check (owner_id = auth.uid());

create or replace function publish_studio_project(project_id uuid)
returns void language plpgsql security definer as $$
begin
  update studio_projects
     set status = 'published', visibility = 'public', published_at = coalesce(published_at, now()), updated_at = now()
   where id = project_id and status = 'review';
end;
$$;

alter publication supabase_realtime add table studio_projects;
