create table if not exists public.notification_deliveries (id uuid primary key default gen_random_uuid(), created_at timestamptz not null default now(), updated_at timestamptz not null default now(), user_id uuid, title text, body text, urgency text not null default 'normal', status learnzur_status not null default 'pending', payload jsonb not null default '{}'::jsonb);
alter table public.notification_deliveries enable row level security;
drop policy if exists notification_deliveries_admin_all on public.notification_deliveries;
create policy notification_deliveries_admin_all on public.notification_deliveries for all using (exists (select 1 from public.user_profiles p where p.id = auth.uid() and p.role = 'admin')) with check (exists (select 1 from public.user_profiles p where p.id = auth.uid() and p.role = 'admin'));
drop trigger if exists trg_notification_deliveries_updated_at on public.notification_deliveries;
create trigger trg_notification_deliveries_updated_at before update on public.notification_deliveries for each row execute function public.learnzur_touch_updated_at();
