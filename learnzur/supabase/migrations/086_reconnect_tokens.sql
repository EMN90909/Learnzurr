create table if not exists public.reconnect_tokens (id uuid primary key default gen_random_uuid(), created_at timestamptz not null default now(), updated_at timestamptz not null default now(), room_id uuid, class_id uuid, user_id uuid, status learnzur_status not null default 'active', payload jsonb not null default '{}'::jsonb);
alter table public.reconnect_tokens enable row level security;
drop policy if exists reconnect_tokens_admin_all on public.reconnect_tokens;
create policy reconnect_tokens_admin_all on public.reconnect_tokens for all using (exists (select 1 from public.user_profiles p where p.id = auth.uid() and p.role = 'admin')) with check (exists (select 1 from public.user_profiles p where p.id = auth.uid() and p.role = 'admin'));
drop trigger if exists trg_reconnect_tokens_updated_at on public.reconnect_tokens;
create trigger trg_reconnect_tokens_updated_at before update on public.reconnect_tokens for each row execute function public.learnzur_touch_updated_at();
