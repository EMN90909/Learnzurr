create or replace function public.learnzur_touch_updated_at() returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end; $$;
