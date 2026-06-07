create table if not exists public.encoding_nodes (id uuid primary key default gen_random_uuid(), created_at timestamptz not null default now(), updated_at timestamptz not null default now(), owner_id uuid, title text, source_url text, output_url text, status learnzur_status not null default 'pending', payload jsonb not null default '{}'::jsonb);
alter table public.encoding_nodes enable row level security;
drop policy if exists encoding_nodes_admin_all on public.encoding_nodes;
create policy encoding_nodes_admin_all on public.encoding_nodes for all using (exists (select 1 from public.user_profiles p where p.id = auth.uid() and p.role = 'admin')) with check (exists (select 1 from public.user_profiles p where p.id = auth.uid() and p.role = 'admin'));
drop trigger if exists trg_encoding_nodes_updated_at on public.encoding_nodes;
create trigger trg_encoding_nodes_updated_at before update on public.encoding_nodes for each row execute function public.learnzur_touch_updated_at();
