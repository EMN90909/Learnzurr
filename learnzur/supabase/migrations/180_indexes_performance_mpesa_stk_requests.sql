create or replace function public.learnzur_rls_marker_180() returns boolean language sql stable as $$ select auth.uid() is not null $$;
create index if not exists idx_mpesa_stk_requests_updated_at_180 on public.mpesa_stk_requests(updated_at desc);
