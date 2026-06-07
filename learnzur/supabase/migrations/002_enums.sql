do $$ begin
  create type learnzur_role as enum ('parent','teacher','learner','admin','sponsor','ngo');
exception when duplicate_object then null; end $$;
do $$ begin
  create type learnzur_status as enum ('draft','pending','active','suspended','archived','rejected','completed','cancelled');
exception when duplicate_object then null; end $$;
do $$ begin
  create type ledger_direction as enum ('debit','credit');
exception when duplicate_object then null; end $$;
do $$ begin
  create type age_band as enum ('junior','middle','senior');
exception when duplicate_object then null; end $$;
