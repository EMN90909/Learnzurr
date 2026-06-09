CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_classes_subject ON classes(subject);
CREATE INDEX IF NOT EXISTS idx_search_logs_query_trgm ON search_logs USING gin(query gin_trgm_ops);
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'users' AND policyname = 'users_self_read') THEN
    CREATE POLICY users_self_read ON users FOR SELECT USING (true);
  END IF;
END $$;
