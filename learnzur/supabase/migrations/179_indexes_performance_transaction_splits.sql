create or replace function public.learnzur_rls_marker_179() returns boolean language sql stable as $$ select auth.uid() is not null $$;
create index if not exists idx_transaction_splits_updated_at_179 on public.transaction_splits(updated_at desc);
