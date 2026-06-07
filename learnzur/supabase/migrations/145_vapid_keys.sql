create table if not exists public.vapid_keys (id uuid primary key default gen_random_uuid(), created_at timestamptz not null default now(), updated_at timestamptz not null default now(), user_id uuid, title text, body text, urgency text not null default 'normal', status learnzur_status not null default 'pending', payload jsonb not null default '{}'::jsonb);
alter table public.vapid_keys enable row level security;
drop policy if exists vapid_keys_admin_all on public.vapid_keys;
create policy vapid_keys_admin_all on public.vapid_keys for all using (exists (select 1 from public.user_profiles p where p.id = auth.uid() and p.role = 'admin')) with check (exists (select 1 from public.user_profiles p where p.id = auth.uid() and p.role = 'admin'));
drop trigger if exists trg_vapid_keys_updated_at on public.vapid_keys;
create trigger trg_vapid_keys_updated_at before update on public.vapid_keys for each row execute function public.learnzur_touch_updated_at();
