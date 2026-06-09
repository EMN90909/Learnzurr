CREATE TABLE IF NOT EXISTS code_sessions (
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
CREATE INDEX IF NOT EXISTS idx_code_sessions_user_id ON code_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_code_sessions_status ON code_sessions(status);
