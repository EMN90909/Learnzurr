create table if not exists public.announcement_targets (id uuid primary key default gen_random_uuid(), created_at timestamptz not null default now(), updated_at timestamptz not null default now(), user_id uuid, title text, body text, urgency text not null default 'normal', status learnzur_status not null default 'pending', payload jsonb not null default '{}'::jsonb);
alter table public.announcement_targets enable row level security;
drop policy if exists announcement_targets_admin_all on public.announcement_targets;
create policy announcement_targets_admin_all on public.announcement_targets for all using (exists (select 1 from public.user_profiles p where p.id = auth.uid() and p.role = 'admin')) with check (exists (select 1 from public.user_profiles p where p.id = auth.uid() and p.role = 'admin'));
drop trigger if exists trg_announcement_targets_updated_at on public.announcement_targets;
create trigger trg_announcement_targets_updated_at before update on public.announcement_targets for each row execute function public.learnzur_touch_updated_at();
