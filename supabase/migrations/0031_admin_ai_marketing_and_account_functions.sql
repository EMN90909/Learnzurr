grant usage on schema public to anon, authenticated, service_role;

alter table public.user_profiles add column if not exists is_banned boolean default false;
alter table public.user_profiles add column if not exists ban_reason text;
alter table public.user_profiles add column if not exists banned_at timestamptz;
alter table public.user_profiles add column if not exists deletion_requested_at timestamptz;
alter table public.user_profiles add column if not exists deleted_at timestamptz;

create table if not exists public.admin_logs (
  id uuid primary key default gen_random_uuid(),
  action text not null,
  target_user_id uuid,
  details jsonb not null default '{}'::jsonb,
  performed_by uuid,
  created_at timestamptz not null default now()
);

create table if not exists public.help_center_articles (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  slug text not null unique,
  content text not null,
  category text not null,
  order_index integer default 0,
  published boolean default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid,
  updated_by uuid
);

create table if not exists public.ai_credit_balances (
  user_id uuid primary key references public.user_profiles(id) on delete cascade,
  daily_free_limit integer not null default 5,
  paid_daily_limit integer not null default 0,
  paid_credits_remaining integer not null default 0,
  last_reset_date date not null default current_date,
  updated_at timestamptz not null default now()
);

create table if not exists public.ai_usage_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.user_profiles(id) on delete cascade,
  provider text not null default 'jamila',
  credit_cost integer not null default 1,
  prompt text,
  created_at timestamptz not null default now()
);

alter table public.admin_logs enable row level security;
alter table public.help_center_articles enable row level security;
alter table public.ai_credit_balances enable row level security;
alter table public.ai_usage_events enable row level security;

drop policy if exists "admin_logs_admin_read" on public.admin_logs;
create policy "admin_logs_admin_read" on public.admin_logs
  for select to authenticated
  using (exists (select 1 from public.user_profiles up where up.id = auth.uid() and up.role = 'admin'));

drop policy if exists "help_center_articles_public_read" on public.help_center_articles;
create policy "help_center_articles_public_read" on public.help_center_articles
  for select to anon, authenticated
  using (published = true or exists (select 1 from public.user_profiles up where up.id = auth.uid() and up.role = 'admin'));

drop policy if exists "help_center_articles_admin_manage" on public.help_center_articles;
create policy "help_center_articles_admin_manage" on public.help_center_articles
  for all to authenticated
  using (exists (select 1 from public.user_profiles up where up.id = auth.uid() and up.role = 'admin'))
  with check (exists (select 1 from public.user_profiles up where up.id = auth.uid() and up.role = 'admin'));

drop policy if exists "ai_credit_balances_owner_read" on public.ai_credit_balances;
create policy "ai_credit_balances_owner_read" on public.ai_credit_balances
  for select to authenticated
  using (user_id = auth.uid() or exists (select 1 from public.user_profiles up where up.id = auth.uid() and up.role = 'admin'));

drop policy if exists "ai_usage_events_owner_read" on public.ai_usage_events;
create policy "ai_usage_events_owner_read" on public.ai_usage_events
  for select to authenticated
  using (user_id = auth.uid() or exists (select 1 from public.user_profiles up where up.id = auth.uid() and up.role = 'admin'));

grant select, insert, update, delete on public.admin_logs to service_role;
grant select, insert, update, delete on public.help_center_articles to anon, authenticated, service_role;
grant select, insert, update, delete on public.ai_credit_balances to authenticated, service_role;
grant select, insert, update, delete on public.ai_usage_events to authenticated, service_role;

create or replace function public.change_user_plan(target_user_id uuid, target_plan text)
returns void
language plpgsql
security definer
as $$
declare
  current_user_id uuid := auth.uid();
  plan_status text := case when lower(target_plan) = 'pro' then 'active' else 'inactive' end;
  payment_state text := case when lower(target_plan) = 'pro' then 'paid' else 'unpaid' end;
  plan_expires timestamptz := case when lower(target_plan) = 'pro' then now() + interval '30 days' else null end;
  existing_subscription_id uuid;
begin
  if not exists (select 1 from public.user_profiles where id = current_user_id and role = 'admin') then
    raise exception 'Only admins can change plans';
  end if;

  select id into existing_subscription_id
  from public.subscriptions
  where user_id = target_user_id or home_id = target_user_id or provider_id = target_user_id
  order by created_at desc
  limit 1;

  if existing_subscription_id is null then
    insert into public.subscriptions (
      user_id,
      plan_name,
      status,
      payment_status,
      started_at,
      expires_at,
      updated_at
    ) values (
      target_user_id,
      lower(target_plan),
      plan_status,
      payment_state,
      case when lower(target_plan) = 'pro' then now() else null end,
      plan_expires,
      now()
    );
  else
    update public.subscriptions
    set plan_name = lower(target_plan),
        status = plan_status,
        payment_status = payment_state,
        started_at = case when lower(target_plan) = 'pro' then now() else null end,
        expires_at = plan_expires,
        updated_at = now()
    where id = existing_subscription_id;
  end if;

  insert into public.admin_logs (action, target_user_id, details, performed_by)
  values ('plan_change', target_user_id, jsonb_build_object('plan', lower(target_plan), 'expires_at', plan_expires), current_user_id);
end;
$$;

create or replace function public.change_user_to_pro(user_id uuid)
returns void
language plpgsql
security definer
as $$
begin
  perform public.change_user_plan(user_id, 'pro');
end;
$$;

create or replace function public.change_user_to_free(user_id uuid)
returns void
language plpgsql
security definer
as $$
begin
  perform public.change_user_plan(user_id, 'free');
end;
$$;

create or replace function public.ban_user(target_user_id uuid, reason text default null)
returns void
language plpgsql
security definer
as $$
declare
  current_user_id uuid := auth.uid();
begin
  if not exists (select 1 from public.user_profiles where id = current_user_id and role = 'admin') then
    raise exception 'Only admins can ban users';
  end if;
  if target_user_id = current_user_id then
    raise exception 'You cannot ban yourself';
  end if;

  update public.user_profiles
  set is_banned = true,
      ban_reason = reason,
      banned_at = now(),
      active = false,
      updated_at = now()
  where id = target_user_id;

  delete from auth.sessions where user_id = target_user_id;

  insert into public.admin_logs (action, target_user_id, details, performed_by)
  values ('user_ban', target_user_id, jsonb_build_object('reason', reason), current_user_id);
end;
$$;

create or replace function public.unban_user(target_user_id uuid)
returns void
language plpgsql
security definer
as $$
declare
  current_user_id uuid := auth.uid();
begin
  if not exists (select 1 from public.user_profiles where id = current_user_id and role = 'admin') then
    raise exception 'Only admins can unban users';
  end if;

  update public.user_profiles
  set is_banned = false,
      ban_reason = null,
      banned_at = null,
      active = true,
      updated_at = now()
  where id = target_user_id;

  insert into public.admin_logs (action, target_user_id, details, performed_by)
  values ('user_unban', target_user_id, '{}'::jsonb, current_user_id);
end;
$$;

create or replace function public.request_account_deletion()
returns void
language plpgsql
security definer
as $$
declare
  current_user_id uuid := auth.uid();
begin
  if current_user_id is null then
    raise exception 'You must be logged in to request account deletion';
  end if;

  update public.user_profiles
  set deletion_requested_at = now(),
      updated_at = now()
  where id = current_user_id;

  insert into public.admin_logs (action, target_user_id, details, performed_by)
  values ('deletion_requested', current_user_id, '{}'::jsonb, current_user_id);
end;
$$;

create or replace function public.approve_account_deletion(target_user_id uuid)
returns void
language plpgsql
security definer
as $$
declare
  current_user_id uuid := auth.uid();
begin
  if not exists (select 1 from public.user_profiles where id = current_user_id and role = 'admin') then
    raise exception 'Only admins can approve account deletions';
  end if;

  update public.user_profiles
  set deleted_at = now(),
      deletion_requested_at = null,
      active = false,
      updated_at = now()
  where id = target_user_id;

  insert into public.admin_logs (action, target_user_id, details, performed_by)
  values ('deletion_approved', target_user_id, '{}'::jsonb, current_user_id);
end;
$$;

create or replace function public.cancel_deletion_request()
returns void
language plpgsql
security definer
as $$
declare
  current_user_id uuid := auth.uid();
begin
  if current_user_id is null then
    raise exception 'You must be logged in to cancel deletion request';
  end if;

  update public.user_profiles
  set deletion_requested_at = null,
      updated_at = now()
  where id = current_user_id and deleted_at is null;
end;
$$;

create or replace function public.delete_account(target_user_id uuid default null)
returns void
language plpgsql
security definer
as $$
declare
  current_user_id uuid := auth.uid();
  user_to_delete uuid := coalesce(target_user_id, current_user_id);
begin
  if target_user_id is not null and not exists (select 1 from public.user_profiles where id = current_user_id and role = 'admin') then
    raise exception 'Only admins can delete other users';
  end if;
  if target_user_id is null and current_user_id is null then
    raise exception 'You must be logged in to delete your account';
  end if;
  if user_to_delete = current_user_id and target_user_id is not null then
    raise exception 'You cannot delete your own account. Contact support.';
  end if;

  update public.user_profiles
  set deleted_at = now(),
      active = false,
      updated_at = now()
  where id = user_to_delete;

  delete from public.notifications where user_id = user_to_delete;
  delete from public.subscriptions where user_id = user_to_delete or home_id = user_to_delete or provider_id = user_to_delete;
  delete from public.push_subscriptions where user_id = user_to_delete;
  delete from auth.users where id = user_to_delete;

  insert into public.admin_logs (action, target_user_id, details, performed_by)
  values ('account_delete', user_to_delete, jsonb_build_object('deleted_by', case when target_user_id is null then 'self' else 'admin' end), current_user_id);
end;
$$;

grant execute on function public.change_user_plan(uuid, text) to authenticated;
grant execute on function public.change_user_to_pro(uuid) to authenticated;
grant execute on function public.change_user_to_free(uuid) to authenticated;
grant execute on function public.ban_user(uuid, text) to authenticated;
grant execute on function public.unban_user(uuid) to authenticated;
grant execute on function public.request_account_deletion() to authenticated;
grant execute on function public.approve_account_deletion(uuid) to authenticated;
grant execute on function public.cancel_deletion_request() to authenticated;
grant execute on function public.delete_account(uuid) to authenticated;
grant execute on function public.delete_account() to authenticated;

insert into public.help_center_articles (title, slug, category, content, order_index, published)
values
  ('Jamila AI support rules', 'jamila-ai-support-rules', 'AI Support', 'Jamila answers using Help Center articles only. If Jamila cannot answer from the articles, Jamila connects the user to human support at info@emtra.top or WhatsApp +254 787073955X. Jamila never asks for passwords or payment information and reminds users never to share passwords.', 1, true),
  ('Payments and invoices', 'payments-and-invoices', 'Billing', 'Invoices can be paid through available checkout options or by verified mobile money details from the funeral home or vendor. Manual payments remain pending until the provider or admin verifies the transaction code.', 2, true),
  ('Requests and planning', 'requests-and-planning', 'Planning', 'Families send requests from Find Funeral Home. Accepted requests create planning records, invoice updates, chat messages, and notifications so families and providers can follow the same case.', 3, true)
on conflict (slug) do update set
  content = excluded.content,
  updated_at = now();

notify pgrst, 'reload schema';
