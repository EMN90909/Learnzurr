DO $$ BEGIN CREATE TYPE user_role AS ENUM ('parent','teacher','learner','admin'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE item_status AS ENUM ('draft','pending','active','suspended','archived'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE severity AS ENUM ('low','medium','high','critical'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
