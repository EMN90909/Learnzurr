-- Production performance layer: indexing, query optimization, full-text search, materialized views, and realtime tables.

create index if not exists idx_service_requests_provider_created
  on public.service_requests(provider_id, provider_type, created_at desc);

create index if not exists idx_service_requests_requester_created
  on public.service_requests(requester_id, created_at desc);

create index if not exists idx_service_requests_status_created
  on public.service_requests(status, created_at desc);

create index if not exists idx_service_requests_updated
  on public.service_requests(updated_at desc);

create index if not exists idx_user_profiles_role_created
  on public.user_profiles(role, created_at desc);

create index if not exists idx_user_profiles_plan_status
  on public.user_profiles(plan_status, is_pro, plan_expires_at);

create index if not exists idx_user_profiles_provider_slug
  on public.user_profiles(provider_slug);

create index if not exists idx_user_profiles_org_manager
  on public.user_profiles(organization_id, manager_id, staff_role);

create index if not exists idx_payments_user_created
  on public.payments(user_id, created_at desc);

create index if not exists idx_payments_provider_created
  on public.payments(provider_id, created_at desc);

create index if not exists idx_payments_request_invoice
  on public.payments(request_id, invoice_id, status);

create index if not exists idx_invoices_request_status
  on public.invoices(request_id, status, created_at desc);

create index if not exists idx_provider_payment_profiles_provider
  on public.provider_payment_profiles(provider_id, is_active);

create index if not exists idx_subscription_payment_requests_status_created
  on public.subscription_payment_requests(status, created_at desc);

create index if not exists idx_referrals_referrer_created
  on public.referrals(referrer_user_id, created_at desc);

create index if not exists idx_referrals_referred_created
  on public.referrals(referred_user_id, created_at desc);

alter table public.user_profiles
  add column if not exists search_vector tsvector generated always as (
    to_tsvector('english', coalesce(full_name,'') || ' ' || coalesce(home_name,'') || ' ' || coalesce(business_name,'') || ' ' || coalesce(email,'') || ' ' || coalesce(town,'') || ' ' || coalesce(address,''))
  ) stored;

create index if not exists idx_user_profiles_search_vector
  on public.user_profiles using gin(search_vector);

alter table public.service_requests
  add column if not exists search_vector tsvector generated always as (
    to_tsvector('english', coalesce(request_title,'') || ' ' || coalesce(request_details,''))
  ) stored;

create index if not exists idx_service_requests_search_vector
  on public.service_requests using gin(search_vector);

create materialized view if not exists public.admin_activity_summary as
select
  now() as refreshed_at,
  (select count(*) from public.user_profiles) as total_users,
  (select count(*) from public.user_profiles where role = 'family') as bereaved_families,
  (select count(*) from public.user_profiles where role = 'operations') as funeral_homes,
  (select count(*) from public.user_profiles where role = 'marketplace') as vendors,
  (select count(*) from public.user_profiles where coalesce(is_pro,false) = true or plan_status = 'active') as pro_accounts,
  (select count(*) from public.service_requests) as total_requests,
  (select count(*) from public.service_requests where status = 'pending') as pending_requests,
  (select count(*) from public.payments where status = 'paid') as paid_payments,
  (select coalesce(sum(amount),0) from public.payments where status = 'paid') as paid_amount_total;

create unique index if not exists idx_admin_activity_summary_singleton
  on public.admin_activity_summary((true));

create or replace function public.refresh_admin_activity_summary()
returns void
language sql
security definer
as $$
  refresh materialized view concurrently public.admin_activity_summary;
$$;

do $$
begin
  alter publication supabase_realtime add table public.notifications;
exception when duplicate_object then null;
end $$;

do $$
begin
  alter publication supabase_realtime add table public.service_requests;
exception when duplicate_object then null;
end $$;

do $$
begin
  alter publication supabase_realtime add table public.payments;
exception when duplicate_object then null;
end $$;

do $$
begin
  alter publication supabase_realtime add table public.policy_review_queue;
exception when duplicate_object then null;
end $$;
