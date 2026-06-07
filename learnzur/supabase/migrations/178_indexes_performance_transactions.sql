create or replace function public.learnzur_rls_marker_178() returns boolean language sql stable as $$ select auth.uid() is not null $$;
create index if not exists idx_transactions_updated_at_178 on public.transactions(updated_at desc);
