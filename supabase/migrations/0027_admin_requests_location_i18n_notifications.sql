-- Admin requests, location/i18n, mobile money, and notification fixes.

alter table public.user_profiles add column if not exists country text;
alter table public.user_profiles add column if not exists division_type text;
alter table public.user_profiles add column if not exists sub_division_type text;
alter table public.user_profiles add column if not exists language text default 'en';
alter table public.user_profiles add column if not exists is_verified_provider boolean default false;
alter table public.user_profiles add column if not exists verified_provider_paid_until timestamptz;
alter table public.user_profiles add column if not exists verified_provider_fee_usd numeric default 4;

update public.user_profiles
set country = coalesce(country, business_country, 'Kenya')
where country is null;

create or replace function public.prevent_duplicate_profile_phone()
returns trigger
language plpgsql
as $$
begin
  if new.phone is not null and length(trim(new.phone)) > 0 then
    if exists (
      select 1
      from public.user_profiles up
      where up.id <> new.id
        and regexp_replace(coalesce(up.phone, ''), '\s+', '', 'g') = regexp_replace(new.phone, '\s+', '', 'g')
    ) then
      raise exception 'Phone number is already used by another account.';
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists prevent_duplicate_profile_phone_trigger on public.user_profiles;
create trigger prevent_duplicate_profile_phone_trigger
  before insert or update of phone on public.user_profiles
  for each row execute function public.prevent_duplicate_profile_phone();

create table if not exists public.marketing_updates (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text not null,
  reward_type text not null,
  reward_days integer not null default 0,
  active boolean not null default true,
  starts_at timestamptz,
  ends_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid references public.user_profiles(id)
);

create table if not exists public.gamification_rewards (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.user_profiles(id) on delete cascade,
  marketing_update_id uuid references public.marketing_updates(id) on delete set null,
  reward_name text not null,
  reward_days integer not null default 0,
  status text not null default 'pending',
  approved_by uuid references public.user_profiles(id),
  approved_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists public.struta_job_queue (
  id uuid primary key default gen_random_uuid(),
  queue_name text not null,
  payload jsonb not null default '{}'::jsonb,
  status text not null default 'queued',
  attempts integer not null default 0,
  available_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.marketing_updates enable row level security;
alter table public.gamification_rewards enable row level security;
alter table public.struta_job_queue enable row level security;

drop policy if exists "marketing_updates_read_active" on public.marketing_updates;
create policy "marketing_updates_read_active"
  on public.marketing_updates for select
  to authenticated
  using (active = true or exists (select 1 from public.user_profiles up where up.id = auth.uid() and up.role = 'admin'));

drop policy if exists "marketing_updates_admin_manage" on public.marketing_updates;
create policy "marketing_updates_admin_manage"
  on public.marketing_updates for all
  to authenticated
  using (exists (select 1 from public.user_profiles up where up.id = auth.uid() and up.role = 'admin'))
  with check (exists (select 1 from public.user_profiles up where up.id = auth.uid() and up.role = 'admin'));

drop policy if exists "gamification_rewards_related_read" on public.gamification_rewards;
create policy "gamification_rewards_related_read"
  on public.gamification_rewards for select
  to authenticated
  using (user_id = auth.uid() or exists (select 1 from public.user_profiles up where up.id = auth.uid() and up.role = 'admin'));

drop policy if exists "gamification_rewards_admin_manage" on public.gamification_rewards;
create policy "gamification_rewards_admin_manage"
  on public.gamification_rewards for all
  to authenticated
  using (exists (select 1 from public.user_profiles up where up.id = auth.uid() and up.role = 'admin'))
  with check (exists (select 1 from public.user_profiles up where up.id = auth.uid() and up.role = 'admin'));

drop policy if exists "struta_job_queue_admin_manage" on public.struta_job_queue;
create policy "struta_job_queue_admin_manage"
  on public.struta_job_queue for all
  to authenticated
  using (exists (select 1 from public.user_profiles up where up.id = auth.uid() and up.role = 'admin'))
  with check (exists (select 1 from public.user_profiles up where up.id = auth.uid() and up.role = 'admin'));

drop policy if exists "notifications_admin_insert_any" on public.notifications;
create policy "notifications_admin_insert_any"
  on public.notifications for insert
  to authenticated
  with check (
    user_id = auth.uid()
    or exists (select 1 from public.user_profiles up where up.id = auth.uid() and up.role = 'admin')
  );

drop policy if exists "notifications_admin_update_any" on public.notifications;
create policy "notifications_admin_update_any"
  on public.notifications for update
  to authenticated
  using (
    user_id = auth.uid()
    or exists (select 1 from public.user_profiles up where up.id = auth.uid() and up.role = 'admin')
  )
  with check (
    user_id = auth.uid()
    or exists (select 1 from public.user_profiles up where up.id = auth.uid() and up.role = 'admin')
  );

drop policy if exists "admin_emails_authenticated_read" on public.admin_emails;
create policy "admin_emails_authenticated_read"
  on public.admin_emails for select
  to authenticated
  using (true);

grant usage on schema public to anon, authenticated;
grant select on public.admin_emails to anon, authenticated;
grant select, insert, update, delete on public.notifications to authenticated;
grant select, insert, update, delete on public.marketing_updates to authenticated;
grant select, insert, update, delete on public.gamification_rewards to authenticated;
grant select, insert, update, delete on public.struta_job_queue to authenticated;

insert into storage.buckets (id, name, public)
values
  ('request-media', 'request-media', true),
  ('listing-images', 'listing-images', true),
  ('memorial-media', 'memorial-media', true)
on conflict (id) do nothing;

insert into public.marketing_updates (title, description, reward_type, reward_days, active) values
  ('Referral Rewards', 'Refer Struta to 10 families and earn 1 week of Pro Plan free.', 'referral', 7, true),
  ('Milestone Unlocks', 'Vendors who complete 50 bookings unlock 2 weeks of Pro Plan.', 'booking_milestone', 14, true),
  ('Streak Bonuses', 'Maintain 30 days of active usage and earn 5 bonus days of Pro Plan.', 'usage_streak', 5, true),
  ('Leaderboard Incentives', 'Top 5 vendors each month get Pro Plan extensions.', 'leaderboard', 7, true),
  ('Seasonal Challenges', 'During festive seasons, complete set goals such as 20 bookings to earn Pro Plan time.', 'seasonal', 7, true),
  ('Family Loyalty', 'Families who use Struta for 3 or more events get a free Pro upgrade for their next booking.', 'family_loyalty', 7, true),
  ('Vendor Growth Bonus', 'Vendors who onboard 5 new staff through the dashboard earn Pro Plan credits.', 'staff_growth', 7, true),
  ('Community Builder', 'Vendors who invite 3 other vendors to join Struta unlock Pro Plan days.', 'community_builder', 7, true),
  ('Feedback Rewards', 'Submit verified feedback or feature requests and earn Pro Plan credits.', 'feedback', 3, true)
on conflict do nothing;
