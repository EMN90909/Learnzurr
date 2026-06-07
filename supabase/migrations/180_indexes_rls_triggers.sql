create or replace function public.set_updated_at() returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

do $$
declare
  r record;
begin
  for r in select schemaname, tablename from pg_tables where schemaname = 'public' loop
    execute format('alter table %I.%I enable row level security', r.schemaname, r.tablename);
    execute format('drop policy if exists %I on %I.%I', r.tablename || '_service_role_all', r.schemaname, r.tablename);
    execute format('create policy %I on %I.%I for all using (auth.role() = ''service_role'') with check (auth.role() = ''service_role'')', r.tablename || '_service_role_all', r.schemaname, r.tablename);
  end loop;
end $$;

do $$
declare
  t text;
begin
  foreach t in array array['users','classes','enrollments','room_chat','lanmat_listings','in_app_notifications','notification_queue','media_jobs'] loop
    begin
      execute format('alter publication supabase_realtime add table public.%I', t);
    exception when duplicate_object then null; when undefined_object then null;
    end;
  end loop;
end $$;

create index if not exists idx_classes_title_trgm on public.classes using gin(title gin_trgm_ops);
create index if not exists idx_lanmat_listings_title_trgm on public.lanmat_listings using gin(title gin_trgm_ops);
create index if not exists idx_users_full_name_trgm on public.users using gin(full_name gin_trgm_ops);
