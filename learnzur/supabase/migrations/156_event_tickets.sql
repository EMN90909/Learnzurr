create table if not exists public.event_tickets (id uuid primary key default gen_random_uuid(), created_at timestamptz not null default now(), updated_at timestamptz not null default now(), owner_id uuid, title text, starts_at timestamptz, ends_at timestamptz, status learnzur_status not null default 'pending', payload jsonb not null default '{}'::jsonb);
alter table public.event_tickets enable row level security;
drop policy if exists event_tickets_admin_all on public.event_tickets;
create policy event_tickets_admin_all on public.event_tickets for all using (exists (select 1 from public.user_profiles p where p.id = auth.uid() and p.role = 'admin')) with check (exists (select 1 from public.user_profiles p where p.id = auth.uid() and p.role = 'admin'));
drop trigger if exists trg_event_tickets_updated_at on public.event_tickets;
create trigger trg_event_tickets_updated_at before update on public.event_tickets for each row execute function public.learnzur_touch_updated_at();
