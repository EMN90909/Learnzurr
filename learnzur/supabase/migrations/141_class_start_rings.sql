create table if not exists public.class_start_rings (id uuid primary key default gen_random_uuid(), created_at timestamptz not null default now(), updated_at timestamptz not null default now(), user_id uuid, title text, body text, urgency text not null default 'normal', status learnzur_status not null default 'pending', payload jsonb not null default '{}'::jsonb);
alter table public.class_start_rings enable row level security;
drop policy if exists class_start_rings_admin_all on public.class_start_rings;
create policy class_start_rings_admin_all on public.class_start_rings for all using (exists (select 1 from public.user_profiles p where p.id = auth.uid() and p.role = 'admin')) with check (exists (select 1 from public.user_profiles p where p.id = auth.uid() and p.role = 'admin'));
drop trigger if exists trg_class_start_rings_updated_at on public.class_start_rings;
create trigger trg_class_start_rings_updated_at before update on public.class_start_rings for each row execute function public.learnzur_touch_updated_at();
