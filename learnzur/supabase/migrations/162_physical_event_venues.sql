create table if not exists public.physical_event_venues (id uuid primary key default gen_random_uuid(), created_at timestamptz not null default now(), updated_at timestamptz not null default now(), owner_id uuid, title text, starts_at timestamptz, ends_at timestamptz, status learnzur_status not null default 'pending', payload jsonb not null default '{}'::jsonb);
alter table public.physical_event_venues enable row level security;
drop policy if exists physical_event_venues_admin_all on public.physical_event_venues;
create policy physical_event_venues_admin_all on public.physical_event_venues for all using (exists (select 1 from public.user_profiles p where p.id = auth.uid() and p.role = 'admin')) with check (exists (select 1 from public.user_profiles p where p.id = auth.uid() and p.role = 'admin'));
drop trigger if exists trg_physical_event_venues_updated_at on public.physical_event_venues;
create trigger trg_physical_event_venues_updated_at before update on public.physical_event_venues for each row execute function public.learnzur_touch_updated_at();
