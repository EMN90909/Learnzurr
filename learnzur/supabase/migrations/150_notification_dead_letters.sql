create table if not exists public.notification_dead_letters (id uuid primary key default gen_random_uuid(), created_at timestamptz not null default now(), updated_at timestamptz not null default now(), user_id uuid, title text, body text, urgency text not null default 'normal', status learnzur_status not null default 'pending', payload jsonb not null default '{}'::jsonb);
alter table public.notification_dead_letters enable row level security;
drop policy if exists notification_dead_letters_admin_all on public.notification_dead_letters;
create policy notification_dead_letters_admin_all on public.notification_dead_letters for all using (exists (select 1 from public.user_profiles p where p.id = auth.uid() and p.role = 'admin')) with check (exists (select 1 from public.user_profiles p where p.id = auth.uid() and p.role = 'admin'));
drop trigger if exists trg_notification_dead_letters_updated_at on public.notification_dead_letters;
create trigger trg_notification_dead_letters_updated_at before update on public.notification_dead_letters for each row execute function public.learnzur_touch_updated_at();
