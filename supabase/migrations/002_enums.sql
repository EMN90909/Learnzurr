do $$ begin
  create type app_role as enum ('parent','teacher','organization','learner','admin','sponsor','ngo');
exception when duplicate_object then null; end $$;
do $$ begin
  create type account_status as enum ('pending','active','suspended','banned','archived');
exception when duplicate_object then null; end $$;
do $$ begin
  create type payment_status as enum ('pending','paid','failed','refunded','reversed');
exception when duplicate_object then null; end $$;
do $$ begin
  create type review_status as enum ('draft','pending_review','approved','rejected','flagged','removed');
exception when duplicate_object then null; end $$;
do $$ begin
  create type urgency_level as enum ('low','normal','high','critical');
exception when duplicate_object then null; end $$;
do $$ begin
  create type severity_level as enum ('info','warning','serious','critical');
exception when duplicate_object then null; end $$;
do $$ begin
  create type age_group as enum ('junior_8_12','middle_13_15','senior_16_18');
exception when duplicate_object then null; end $$;
