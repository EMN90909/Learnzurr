CREATE TABLE IF NOT EXISTS contest_judges (
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
CREATE INDEX IF NOT EXISTS idx_contest_judges_user_id ON contest_judges(user_id);
CREATE INDEX IF NOT EXISTS idx_contest_judges_status ON contest_judges(status);
