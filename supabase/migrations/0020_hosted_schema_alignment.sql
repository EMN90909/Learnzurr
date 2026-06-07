alter table public.user_profiles add column if not exists services_offered jsonb default '{}'::jsonb;
alter table public.user_profiles add column if not exists listing_images jsonb default '[]'::jsonb;
alter table public.user_profiles add column if not exists business_country text default 'Kenya';
alter table public.user_profiles add column if not exists paypal_email text;
alter table public.user_profiles add column if not exists mpesa_phone text;
alter table public.user_profiles add column if not exists provider_rating numeric(3,1) default 0;
alter table public.user_profiles add column if not exists reviews_count integer default 0;

alter table public.push_subscriptions add column if not exists role text default 'bereaved';

create index if not exists push_subscriptions_role_idx on public.push_subscriptions(role);
