-- Provider business info on profiles (services, listings, payments)
alter table public.user_profiles add column if not exists services_offered jsonb default '{}'::jsonb;
alter table public.user_profiles add column if not exists listing_images jsonb default '[]'::jsonb;
alter table public.user_profiles add column if not exists business_country text default 'Kenya';
alter table public.user_profiles add column if not exists paypal_email text;
alter table public.user_profiles add column if not exists mpesa_phone text;
alter table public.user_profiles add column if not exists provider_rating numeric(3,1) default 0;
alter table public.user_profiles add column if not exists reviews_count integer default 0;

-- Trial card onboarding on subscriptions
alter table public.subscriptions add column if not exists trial_card_skipped boolean default false;
alter table public.subscriptions add column if not exists trial_card_added boolean default false;
