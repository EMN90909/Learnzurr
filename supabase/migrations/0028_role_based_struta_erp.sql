alter table public.user_profiles
  add column if not exists organization_id uuid,
  add column if not exists manager_id uuid,
  add column if not exists staff_role text,
  add column if not exists staff_business_type text,
  add column if not exists general_code text default 'STRUTA2026',
  add column if not exists force_password_change boolean default false,
  add column if not exists business_country text;

create table if not exists public.erp_organization_settings (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null unique,
  organization_type text not null default 'home',
  general_code text not null default 'STRUTA2026',
  created_by uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.erp_staff (
  id uuid primary key default gen_random_uuid(),
  home_id uuid not null,
  organization_type text not null default 'home',
  user_id uuid,
  name text not null,
  email text,
  role text not null,
  roles text[],
  is_active boolean not null default true,
  last_login_at timestamptz,
  invited_by uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.erp_staff
  add column if not exists home_id uuid,
  add column if not exists organization_type text default 'home',
  add column if not exists user_id uuid,
  add column if not exists name text,
  add column if not exists email text,
  add column if not exists role text,
  add column if not exists roles text[],
  add column if not exists is_active boolean default true,
  add column if not exists last_login_at timestamptz,
  add column if not exists invited_by uuid,
  add column if not exists updated_at timestamptz default now();

create table if not exists public.erp_staff_invites (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null,
  organization_type text not null default 'home',
  staff_name text,
  email text not null,
  role text not null,
  token text not null unique,
  general_code text not null default 'STRUTA2026',
  expires_at timestamptz not null,
  status text not null default 'pending',
  invited_by uuid,
  accepted_by uuid,
  accepted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.erp_cases (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null,
  organization_type text not null default 'home',
  source_request_id uuid,
  deceased_name text not null,
  age integer,
  gender text,
  family_contact_name text,
  family_phone text,
  family_email text,
  date_of_death date,
  burial_date date,
  budget numeric,
  service_type text,
  country text,
  county text,
  sub_county text,
  location text,
  status text not null default 'New',
  created_by uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.erp_tasks (
  id uuid primary key default gen_random_uuid(),
  home_id uuid not null,
  organization_id uuid not null,
  case_id uuid references public.erp_cases(id) on delete cascade,
  assigned_to uuid,
  assigned_staff_id uuid,
  assigned_role text,
  task_type text not null,
  title text not null,
  description text,
  status text not null default 'Pending',
  due_at timestamptz,
  notes text,
  completed_at timestamptz,
  created_by uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.erp_tasks
  add column if not exists home_id uuid,
  add column if not exists organization_id uuid,
  add column if not exists case_id uuid,
  add column if not exists assigned_to uuid,
  add column if not exists assigned_staff_id uuid,
  add column if not exists assigned_role text,
  add column if not exists task_type text,
  add column if not exists title text,
  add column if not exists description text,
  add column if not exists status text default 'Pending',
  add column if not exists due_at timestamptz,
  add column if not exists notes text,
  add column if not exists completed_at timestamptz,
  add column if not exists created_by uuid,
  add column if not exists updated_at timestamptz default now();

create table if not exists public.erp_vehicles (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null,
  organization_type text not null default 'home',
  vehicle_type text not null,
  plate_number text not null,
  capacity integer,
  color text,
  status text not null default 'Available',
  assigned_driver_id uuid,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.erp_case_messages (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null,
  case_id uuid references public.erp_cases(id) on delete cascade,
  sender_id uuid not null,
  body text,
  attachment_path text,
  created_at timestamptz not null default now()
);

create index if not exists user_profiles_organization_id_idx on public.user_profiles (organization_id);
create index if not exists user_profiles_staff_role_idx on public.user_profiles (staff_role);
create index if not exists erp_staff_home_id_idx on public.erp_staff (home_id);
create index if not exists erp_staff_user_id_idx on public.erp_staff (user_id);
create index if not exists erp_staff_invites_token_idx on public.erp_staff_invites (token);
create index if not exists erp_cases_org_created_idx on public.erp_cases (organization_id, created_at desc);
create index if not exists erp_tasks_org_assigned_idx on public.erp_tasks (organization_id, assigned_to, created_at desc);
create index if not exists erp_tasks_case_idx on public.erp_tasks (case_id);
create index if not exists erp_vehicles_org_idx on public.erp_vehicles (organization_id);
create index if not exists erp_case_messages_case_idx on public.erp_case_messages (case_id, created_at desc);

alter table public.erp_organization_settings enable row level security;
alter table public.erp_staff enable row level security;
alter table public.erp_staff_invites enable row level security;
alter table public.erp_cases enable row level security;
alter table public.erp_tasks enable row level security;
alter table public.erp_vehicles enable row level security;
alter table public.erp_case_messages enable row level security;

grant select, insert, update, delete on public.erp_organization_settings to authenticated;
grant select, insert, update, delete on public.erp_staff to authenticated;
grant select, insert, update, delete on public.erp_staff_invites to authenticated;
grant select, insert, update, delete on public.erp_cases to authenticated;
grant select, insert, update, delete on public.erp_tasks to authenticated;
grant select, insert, update, delete on public.erp_vehicles to authenticated;
grant select, insert, update, delete on public.erp_case_messages to authenticated;

drop policy if exists "ERP settings org access" on public.erp_organization_settings;
create policy "ERP settings org access" on public.erp_organization_settings
  for all to authenticated
  using (
    auth.uid() = organization_id
    or exists (
      select 1 from public.user_profiles up
      where up.id = auth.uid()
        and (up.role = 'admin' or up.organization_id = erp_organization_settings.organization_id or up.manager_id = erp_organization_settings.organization_id)
    )
  )
  with check (
    auth.uid() = organization_id
    or exists (
      select 1 from public.user_profiles up
      where up.id = auth.uid()
        and (up.role = 'admin' or up.organization_id = erp_organization_settings.organization_id or up.manager_id = erp_organization_settings.organization_id)
    )
  );

drop policy if exists "ERP staff org access" on public.erp_staff;
create policy "ERP staff org access" on public.erp_staff
  for all to authenticated
  using (
    auth.uid() = home_id
    or auth.uid() = user_id
    or exists (
      select 1 from public.user_profiles up
      where up.id = auth.uid()
        and (up.role = 'admin' or up.organization_id = erp_staff.home_id or up.manager_id = erp_staff.home_id)
    )
  )
  with check (
    auth.uid() = home_id
    or auth.uid() = user_id
    or exists (
      select 1 from public.user_profiles up
      where up.id = auth.uid()
        and (up.role = 'admin' or up.organization_id = erp_staff.home_id or up.manager_id = erp_staff.home_id)
    )
  );

drop policy if exists "ERP invites manager access" on public.erp_staff_invites;
create policy "ERP invites manager access" on public.erp_staff_invites
  for all to authenticated
  using (
    auth.uid() = invited_by
    or auth.uid() = organization_id
    or exists (
      select 1 from public.user_profiles up
      where up.id = auth.uid()
        and (up.role = 'admin' or up.organization_id = erp_staff_invites.organization_id or up.manager_id = erp_staff_invites.organization_id)
    )
  )
  with check (
    auth.uid() = invited_by
    or auth.uid() = organization_id
    or exists (
      select 1 from public.user_profiles up
      where up.id = auth.uid()
        and (up.role = 'admin' or up.organization_id = erp_staff_invites.organization_id or up.manager_id = erp_staff_invites.organization_id)
    )
  );

drop policy if exists "ERP cases role access" on public.erp_cases;
create policy "ERP cases role access" on public.erp_cases
  for select to authenticated
  using (
    auth.uid() = organization_id
    or exists (
      select 1 from public.user_profiles up
      where up.id = auth.uid()
        and (
          up.role = 'admin'
          or up.id = erp_cases.organization_id
          or ((up.organization_id = erp_cases.organization_id or up.manager_id = erp_cases.organization_id) and coalesce(up.staff_role, up.role) = 'Coordinator')
        )
    )
    or exists (
      select 1 from public.erp_tasks task
      where task.case_id = erp_cases.id
        and (task.assigned_to = auth.uid() or exists (
          select 1 from public.user_profiles up
          where up.id = auth.uid()
            and (up.organization_id = erp_cases.organization_id or up.manager_id = erp_cases.organization_id)
            and task.assigned_role = coalesce(up.staff_role, up.role)
        ))
    )
  );

drop policy if exists "ERP cases manager coordinator write" on public.erp_cases;
create policy "ERP cases manager coordinator write" on public.erp_cases
  for all to authenticated
  using (
    auth.uid() = organization_id
    or exists (
      select 1 from public.user_profiles up
      where up.id = auth.uid()
        and (
          up.role = 'admin'
          or up.id = erp_cases.organization_id
          or ((up.organization_id = erp_cases.organization_id or up.manager_id = erp_cases.organization_id) and coalesce(up.staff_role, up.role) = 'Coordinator')
        )
    )
    or exists (
      select 1 from public.erp_tasks task
      where task.case_id = erp_cases.id
        and (task.assigned_to = auth.uid() or exists (
          select 1 from public.user_profiles up
          where up.id = auth.uid()
            and (up.organization_id = erp_cases.organization_id or up.manager_id = erp_cases.organization_id)
            and task.assigned_role = coalesce(up.staff_role, up.role)
        ))
    )
  )
  with check (
    auth.uid() = organization_id
    or exists (
      select 1 from public.user_profiles up
      where up.id = auth.uid()
        and (
          up.role = 'admin'
          or up.id = erp_cases.organization_id
          or ((up.organization_id = erp_cases.organization_id or up.manager_id = erp_cases.organization_id) and coalesce(up.staff_role, up.role) = 'Coordinator')
        )
    )
    or exists (
      select 1 from public.erp_tasks task
      where task.case_id = erp_cases.id
        and (task.assigned_to = auth.uid() or exists (
          select 1 from public.user_profiles up
          where up.id = auth.uid()
            and (up.organization_id = erp_cases.organization_id or up.manager_id = erp_cases.organization_id)
            and task.assigned_role = coalesce(up.staff_role, up.role)
        ))
    )
  );

drop policy if exists "ERP tasks role access" on public.erp_tasks;
create policy "ERP tasks role access" on public.erp_tasks
  for all to authenticated
  using (
    auth.uid() = organization_id
    or assigned_to = auth.uid()
    or exists (
      select 1 from public.user_profiles up
      where up.id = auth.uid()
        and (
          up.role = 'admin'
          or up.id = erp_tasks.organization_id
          or ((up.organization_id = erp_tasks.organization_id or up.manager_id = erp_tasks.organization_id)
            and (coalesce(up.staff_role, up.role) = 'Coordinator' or assigned_role = coalesce(up.staff_role, up.role)))
        )
    )
  )
  with check (
    auth.uid() = organization_id
    or assigned_to = auth.uid()
    or exists (
      select 1 from public.user_profiles up
      where up.id = auth.uid()
        and (
          up.role = 'admin'
          or up.id = erp_tasks.organization_id
          or ((up.organization_id = erp_tasks.organization_id or up.manager_id = erp_tasks.organization_id)
            and (coalesce(up.staff_role, up.role) = 'Coordinator' or assigned_role = coalesce(up.staff_role, up.role)))
        )
    )
  );

drop policy if exists "ERP vehicles manager driver access" on public.erp_vehicles;
create policy "ERP vehicles manager driver access" on public.erp_vehicles
  for all to authenticated
  using (
    auth.uid() = organization_id
    or assigned_driver_id = auth.uid()
    or exists (
      select 1 from public.user_profiles up
      where up.id = auth.uid()
        and (
          up.role = 'admin'
          or up.id = erp_vehicles.organization_id
          or ((up.organization_id = erp_vehicles.organization_id or up.manager_id = erp_vehicles.organization_id) and coalesce(up.staff_role, up.role) = 'Driver')
        )
    )
  )
  with check (
    auth.uid() = organization_id
    or assigned_driver_id = auth.uid()
    or exists (
      select 1 from public.user_profiles up
      where up.id = auth.uid()
        and (
          up.role = 'admin'
          or up.id = erp_vehicles.organization_id
          or ((up.organization_id = erp_vehicles.organization_id or up.manager_id = erp_vehicles.organization_id) and coalesce(up.staff_role, up.role) = 'Driver')
        )
    )
  );

drop policy if exists "ERP messages case participants" on public.erp_case_messages;
create policy "ERP messages case participants" on public.erp_case_messages
  for all to authenticated
  using (
    sender_id = auth.uid()
    or auth.uid() = organization_id
    or exists (
      select 1 from public.user_profiles up
      where up.id = auth.uid()
        and (up.role = 'admin' or up.id = erp_case_messages.organization_id or up.organization_id = erp_case_messages.organization_id or up.manager_id = erp_case_messages.organization_id)
    )
  )
  with check (
    sender_id = auth.uid()
    or auth.uid() = organization_id
    or exists (
      select 1 from public.user_profiles up
      where up.id = auth.uid()
        and (up.role = 'admin' or up.id = erp_case_messages.organization_id or up.organization_id = erp_case_messages.organization_id or up.manager_id = erp_case_messages.organization_id)
    )
  );

do $$
begin
  begin alter publication supabase_realtime add table public.erp_cases; exception when duplicate_object then null; end;
  begin alter publication supabase_realtime add table public.erp_tasks; exception when duplicate_object then null; end;
  begin alter publication supabase_realtime add table public.erp_vehicles; exception when duplicate_object then null; end;
  begin alter publication supabase_realtime add table public.erp_case_messages; exception when duplicate_object then null; end;
end $$;
