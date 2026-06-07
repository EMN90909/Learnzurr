create table if not exists public.meeting_invites (id uuid primary key default gen_random_uuid(), created_at timestamptz not null default now(), updated_at timestamptz not null default now(), room_id uuid, class_id uuid, user_id uuid, status learnzur_status not null default 'active', payload jsonb not null default '{}'::jsonb);
alter table public.meeting_invites enable row level security;
drop policy if exists meeting_invites_admin_all on public.meeting_invites;
create policy meeting_invites_admin_all on public.meeting_invites for all using (exists (select 1 from public.user_profiles p where p.id = auth.uid() and p.role = 'admin')) with check (exists (select 1 from public.user_profiles p where p.id = auth.uid() and p.role = 'admin'));
drop trigger if exists trg_meeting_invites_updated_at on public.meeting_invites;
create trigger trg_meeting_invites_updated_at before update on public.meeting_invites for each row execute function public.learnzur_touch_updated_at();
