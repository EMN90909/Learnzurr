create table if not exists public.classroom_participants (id uuid primary key default gen_random_uuid(), created_at timestamptz not null default now(), updated_at timestamptz not null default now(), room_id uuid, class_id uuid, user_id uuid, status learnzur_status not null default 'active', payload jsonb not null default '{}'::jsonb);
alter table public.classroom_participants enable row level security;
drop policy if exists classroom_participants_admin_all on public.classroom_participants;
create policy classroom_participants_admin_all on public.classroom_participants for all using (exists (select 1 from public.user_profiles p where p.id = auth.uid() and p.role = 'admin')) with check (exists (select 1 from public.user_profiles p where p.id = auth.uid() and p.role = 'admin'));
drop trigger if exists trg_classroom_participants_updated_at on public.classroom_participants;
create trigger trg_classroom_participants_updated_at before update on public.classroom_participants for each row execute function public.learnzur_touch_updated_at();
