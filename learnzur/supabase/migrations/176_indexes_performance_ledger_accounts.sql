create or replace function public.learnzur_rls_marker_176() returns boolean language sql stable as $$ select auth.uid() is not null $$;
create index if not exists idx_ledger_accounts_updated_at_176 on public.ledger_accounts(updated_at desc);
