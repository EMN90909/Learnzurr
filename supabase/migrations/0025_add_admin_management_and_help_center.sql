-- Add admin_emails table to manage admins without hardcoding
create table if not exists public.admin_emails (
  id uuid primary key default gen_random_uuid(),
  email text not null unique,
  created_at timestamp with time zone default now(),
  created_by uuid references public.user_profiles(id)
);

-- Add help_center_articles table for admin-managed content
create table if not exists public.help_center_articles (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  slug text not null unique,
  content text not null,
  category text not null,
  order_index int default 0,
  published boolean default true,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now(),
  created_by uuid references public.user_profiles(id),
  updated_by uuid references public.user_profiles(id)
);

-- Add accent_colors table for theme customization
create table if not exists public.accent_colors (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  hex_code text not null,
  description text,
  created_at timestamp with time zone default now()
);

-- Enable RLS on admin_emails
alter table public.admin_emails enable row level security;

create policy "public_read_admin_emails" on public.admin_emails
  for select
  to authenticated
  using (true);

create policy "admin_manage_admin_emails" on public.admin_emails
  for all
  to authenticated
  using (
    (select exists(select 1 from public.admin_emails where email = auth.jwt()->'email' and auth.jwt()->>'email' is not null))
  );

-- Enable RLS on help_center_articles
alter table public.help_center_articles enable row level security;

create policy "public_read_published_articles" on public.help_center_articles
  for select
  to authenticated
  using (published = true);

create policy "admin_manage_articles" on public.help_center_articles
  for all
  to authenticated
  using (
    (select exists(select 1 from public.admin_emails where email = auth.jwt()->'email' and auth.jwt()->>'email' is not null))
  );

-- Enable RLS on accent_colors
alter table public.accent_colors enable row level security;

create policy "public_read_accent_colors" on public.accent_colors
  for select
  using (true);

create policy "admin_manage_accent_colors" on public.accent_colors
  for all
  to authenticated
  using (
    (select exists(select 1 from public.admin_emails where email = auth.jwt()->'email' and auth.jwt()->>'email' is not null))
  );

-- Insert initial admin email
insert into public.admin_emails (email) values ('info@emtra.top')
on conflict (email) do nothing;

-- Insert default accent colors
insert into public.accent_colors (name, hex_code, description) values
  ('Blue', '#3B82F6', 'Professional blue accent'),
  ('Purple', '#9333EA', 'Elegant purple accent'),
  ('Pink', '#EC4899', 'Vibrant pink accent'),
  ('Green', '#10B981', 'Fresh green accent'),
  ('Amber', '#F59E0B', 'Warm amber accent'),
  ('Rose', '#F43F5E', 'Soft rose accent')
on conflict do nothing;

-- Grant notifications schema access for all authenticated users
grant usage on schema public to authenticated;
grant select, insert, update on public.admin_emails to authenticated;
grant select, insert, update, delete on public.help_center_articles to authenticated;
grant select on public.accent_colors to authenticated;

-- Notify PostgREST to reload schema cache
select pgrst.http_notify(
  'http://localhost:3001/rpc/db_change_notification',
  json_build_object('action', 'reload_schema')
);
