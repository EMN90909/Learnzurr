create or replace function public.learnzur_rls_marker_177() returns boolean language sql stable as $$ select auth.uid() is not null $$;
create index if not exists idx_ledger_entries_updated_at_177 on public.ledger_entries(updated_at desc);
