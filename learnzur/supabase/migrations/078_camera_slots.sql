create table if not exists public.camera_slots (id uuid primary key default gen_random_uuid(), created_at timestamptz not null default now(), updated_at timestamptz not null default now(), room_id uuid, class_id uuid, user_id uuid, status learnzur_status not null default 'active', payload jsonb not null default '{}'::jsonb);
alter table public.camera_slots enable row level security;
drop policy if exists camera_slots_admin_all on public.camera_slots;
create policy camera_slots_admin_all on public.camera_slots for all using (exists (select 1 from public.user_profiles p where p.id = auth.uid() and p.role = 'admin')) with check (exists (select 1 from public.user_profiles p where p.id = auth.uid() and p.role = 'admin'));
drop trigger if exists trg_camera_slots_updated_at on public.camera_slots;
create trigger trg_camera_slots_updated_at before update on public.camera_slots for each row execute function public.learnzur_touch_updated_at();
