CREATE TABLE IF NOT EXISTS notify_ab_tests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid,
  title text,
  name text,
  status text DEFAULT 'active',
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  amount_cents integer DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_notify_ab_tests_user_id ON notify_ab_tests(user_id);
CREATE INDEX IF NOT EXISTS idx_notify_ab_tests_status ON notify_ab_tests(status);
