create extension if not exists pgcrypto;

create table if not exists public.businesses (
  id uuid primary key default gen_random_uuid(),
  business_type text not null check (business_type in ('operations', 'marketplace')),
  name text not null,
  owner_user_id uuid not null,
  county text,
  town text,
  address text,
  phone text,
  email text,
  domain_slug text unique,
  staff_access_code text,
  staff_code_enabled boolean default false,
  active boolean default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.business_settings (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null,
  language text default 'en' check (language in ('en', 'sw')),
  theme_mode text default 'system' check (theme_mode in ('light', 'dark', 'system')),
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique (business_id)
);

create table if not exists public.user_settings (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  language text default 'en' check (language in ('en', 'sw')),
  theme_mode text default 'system' check (theme_mode in ('light', 'dark', 'system')),
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique (user_id)
);

create table if not exists public.staff_members (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null,
  business_type text not null check (business_type in ('operations', 'marketplace')),
  user_id uuid,
  staff_name text not null,
  normalized_staff_name text not null,
  task_description text,
  branch_id uuid,
  phone text,
  email text,
  status text default 'active' check (status in ('active', 'inactive')),
  created_by uuid,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique (business_id, normalized_staff_name)
);

create table if not exists public.staff_roles (
  id uuid primary key default gen_random_uuid(),
  staff_member_id uuid not null,
  role text not null,
  created_at timestamptz default now()
);

create table if not exists public.case_members (
  id uuid primary key default gen_random_uuid(),
  case_id uuid not null,
  user_id uuid,
  invited_email text,
  invited_phone text,
  name text not null,
  relationship_to_deceased text,
  role text not null,
  permissions jsonb not null default '{"view": true, "upload_media": false, "comment": false, "approve_memorial": false, "manage_case": false}'::jsonb,
  status text default 'Pending',
  invited_by uuid,
  accepted_at timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.case_invitations (
  id uuid primary key default gen_random_uuid(),
  case_id uuid not null,
  invited_email text not null,
  invited_name text not null,
  relationship_to_deceased text,
  role text not null,
  permissions jsonb not null default '{"view": true}'::jsonb,
  token_hash text not null unique,
  status text default 'Pending',
  expires_at timestamptz not null,
  invited_by uuid,
  accepted_by uuid,
  accepted_at timestamptz,
  revoked_at timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.memorial_content_approvals (
  id uuid primary key default gen_random_uuid(),
  memorial_id uuid not null,
  content_id uuid,
  approver_user_id uuid not null,
  status text default 'Pending',
  notes text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.app_job_queue (
  id uuid primary key default gen_random_uuid(),
  job_type text not null,
  payload jsonb not null default '{}'::jsonb,
  status text default 'queued',
  attempts integer default 0,
  run_after timestamptz default now(),
  created_by uuid,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.user_profiles add column if not exists domain_slug text unique;
alter table public.user_profiles add column if not exists staff_access_code text;
alter table public.user_profiles add column if not exists staff_code_enabled boolean default false;
alter table public.user_profiles add column if not exists language text default 'en';
alter table public.user_profiles add column if not exists theme_mode text default 'system';
alter table public.user_profiles add column if not exists is_vendor boolean default false;

create or replace function public.normalize_staff_name(input text)
returns text language sql immutable as $$
  select regexp_replace(lower(trim(coalesce(input, ''))), '\s+', ' ', 'g');
$$;

create or replace function public.handle_new_user()
returns trigger as $$
begin
  update auth.users set email_confirmed_at = coalesce(email_confirmed_at, now()) where id = new.id;

  insert into public.user_profiles (
    id, email, role, full_name, home_name, is_home, is_vendor, county, town, phone,
    address, domain_slug, active, language, theme_mode, updated_at
  )
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'role', 'family'),
    coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'home_name', new.email),
    new.raw_user_meta_data->>'home_name',
    coalesce((new.raw_user_meta_data->>'is_home')::boolean, false),
    coalesce((new.raw_user_meta_data->>'is_vendor')::boolean, false),
    new.raw_user_meta_data->>'county',
    new.raw_user_meta_data->>'town',
    new.raw_user_meta_data->>'phone',
    new.raw_user_meta_data->>'address',
    new.raw_user_meta_data->>'domain_slug',
    coalesce((new.raw_user_meta_data->>'active')::boolean, true),
    coalesce(new.raw_user_meta_data->>'language', 'en'),
    coalesce(new.raw_user_meta_data->>'theme_mode', 'system'),
    now()
  )
  on conflict (id) do update set
    email = excluded.email,
    role = excluded.role,
    full_name = excluded.full_name,
    home_name = excluded.home_name,
    is_home = excluded.is_home,
    is_vendor = excluded.is_vendor,
    county = excluded.county,
    town = excluded.town,
    phone = excluded.phone,
    address = excluded.address,
    domain_slug = excluded.domain_slug,
    active = excluded.active,
    language = excluded.language,
    theme_mode = excluded.theme_mode,
    updated_at = now();

  insert into public.user_settings (user_id, language, theme_mode)
  values (new.id, coalesce(new.raw_user_meta_data->>'language', 'en'), coalesce(new.raw_user_meta_data->>'theme_mode', 'system'))
  on conflict (user_id) do nothing;

  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

grant select, insert, update on public.user_profiles to authenticated;
grant select, insert, update, delete on public.businesses to authenticated;
grant select, insert, update, delete on public.business_settings to authenticated;
grant select, insert, update, delete on public.user_settings to authenticated;
grant select, insert, update, delete on public.staff_members to authenticated;
grant select, insert, update, delete on public.staff_roles to authenticated;
grant select, insert, update, delete on public.case_members to authenticated;
grant select, insert, update, delete on public.case_invitations to authenticated;
grant select, insert, update, delete on public.memorial_content_approvals to authenticated;
grant select, insert, update on public.app_job_queue to authenticated;

alter table public.businesses enable row level security;
alter table public.business_settings enable row level security;
alter table public.user_settings enable row level security;
alter table public.staff_members enable row level security;
alter table public.staff_roles enable row level security;
alter table public.case_members enable row level security;
alter table public.case_invitations enable row level security;
alter table public.memorial_content_approvals enable row level security;
alter table public.app_job_queue enable row level security;
alter table public.memorial_requests enable row level security;
alter table public.memorial_pages enable row level security;

drop policy if exists "Users can view their own profile" on public.user_profiles;
create policy "Users can view their own profile" on public.user_profiles
  for select to authenticated using (auth.uid() = id);
drop policy if exists "Users can update their own profile" on public.user_profiles;
create policy "Users can update their own profile" on public.user_profiles
  for update to authenticated using (auth.uid() = id) with check (auth.uid() = id);
drop policy if exists "Users can insert their own profile" on public.user_profiles;
create policy "Users can insert their own profile" on public.user_profiles
  for insert to authenticated with check (auth.uid() = id);
drop policy if exists "Authenticated users can find active funeral homes" on public.user_profiles;
create policy "Authenticated users can find active funeral homes" on public.user_profiles
  for select to authenticated using (is_home = true and role = 'operations' and coalesce(active, true) = true);
drop policy if exists "Authenticated users can find active vendors" on public.user_profiles;
create policy "Authenticated users can find active vendors" on public.user_profiles
  for select to authenticated using (is_vendor = true and role = 'marketplace' and coalesce(active, true) = true);

drop policy if exists "Owners manage businesses" on public.businesses;
create policy "Owners manage businesses" on public.businesses
  for all to authenticated using (auth.uid() = owner_user_id) with check (auth.uid() = owner_user_id);
drop policy if exists "Authenticated users can find active businesses" on public.businesses;
create policy "Authenticated users can find active businesses" on public.businesses
  for select to authenticated using (coalesce(active, true) = true);

drop policy if exists "Owners manage business settings" on public.business_settings;
create policy "Owners manage business settings" on public.business_settings
  for all to authenticated using (
    exists (select 1 from public.businesses b where b.id = business_id and b.owner_user_id = auth.uid())
  ) with check (
    exists (select 1 from public.businesses b where b.id = business_id and b.owner_user_id = auth.uid())
  );

drop policy if exists "Users manage own settings" on public.user_settings;
create policy "Users manage own settings" on public.user_settings
  for all to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "Business owners manage staff" on public.staff_members;
create policy "Business owners manage staff" on public.staff_members
  for all to authenticated using (
    created_by = auth.uid() or exists (select 1 from public.businesses b where b.id = business_id and b.owner_user_id = auth.uid())
  ) with check (
    created_by = auth.uid() or exists (select 1 from public.businesses b where b.id = business_id and b.owner_user_id = auth.uid())
  );
drop policy if exists "Staff can read own record" on public.staff_members;
create policy "Staff can read own record" on public.staff_members
  for select to authenticated using (user_id = auth.uid());

drop policy if exists "Business owners manage staff roles" on public.staff_roles;
create policy "Business owners manage staff roles" on public.staff_roles
  for all to authenticated using (
    exists (
      select 1 from public.staff_members sm
      join public.businesses b on b.id = sm.business_id
      where sm.id = staff_member_id and b.owner_user_id = auth.uid()
    )
  ) with check (
    exists (
      select 1 from public.staff_members sm
      join public.businesses b on b.id = sm.business_id
      where sm.id = staff_member_id and b.owner_user_id = auth.uid()
    )
  );

drop policy if exists "Case members read case members" on public.case_members;
create policy "Case members read case members" on public.case_members
  for select to authenticated using (
    user_id = auth.uid() or invited_by = auth.uid() or exists (
      select 1 from public.funeral_cases fc where fc.id = case_id and (fc.home_id = auth.uid() or fc.family_user_id = auth.uid())
    )
  );
drop policy if exists "Case managers create case members" on public.case_members;
create policy "Case managers create case members" on public.case_members
  for insert to authenticated with check (
    invited_by = auth.uid() or exists (
      select 1 from public.funeral_cases fc where fc.id = case_id and (fc.home_id = auth.uid() or fc.family_user_id = auth.uid())
    )
  );

drop policy if exists "Case managers manage invitations" on public.case_invitations;
create policy "Case managers manage invitations" on public.case_invitations
  for all to authenticated using (
    invited_by = auth.uid() or accepted_by = auth.uid() or exists (
      select 1 from public.funeral_cases fc where fc.id = case_id and (fc.home_id = auth.uid() or fc.family_user_id = auth.uid())
    )
  ) with check (
    invited_by = auth.uid() or exists (
      select 1 from public.funeral_cases fc where fc.id = case_id and (fc.home_id = auth.uid() or fc.family_user_id = auth.uid())
    )
  );

drop policy if exists "Users manage queued own jobs" on public.app_job_queue;
create policy "Users manage queued own jobs" on public.app_job_queue
  for all to authenticated using (created_by = auth.uid()) with check (created_by = auth.uid());

drop policy if exists "Users read own memorial requests" on public.memorial_requests;
drop policy if exists "memorial_pages_select_policy" on public.memorial_pages;
drop policy if exists "memorial_pages_insert_policy" on public.memorial_pages;
drop policy if exists "memorial_pages_update_policy" on public.memorial_pages;
drop policy if exists "Public memorial pages are readable" on public.memorial_pages;
create policy "Users read own memorial requests" on public.memorial_requests
  for select to authenticated using (user_id = auth.uid());
drop policy if exists "Users create own memorial requests" on public.memorial_requests;
create policy "Users create own memorial requests" on public.memorial_requests
  for insert to authenticated with check (user_id = auth.uid());
drop policy if exists "Users update own memorial requests" on public.memorial_requests;
create policy "Users update own memorial requests" on public.memorial_requests
  for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

drop policy if exists "Memorial pages scoped read" on public.memorial_pages;
create policy "Memorial pages scoped read" on public.memorial_pages
  for select using (coalesce(is_public, false) = true or user_id = auth.uid());
drop policy if exists "Users manage own memorial pages" on public.memorial_pages;
create policy "Users manage own memorial pages" on public.memorial_pages
  for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
