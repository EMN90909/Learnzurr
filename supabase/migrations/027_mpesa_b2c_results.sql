CREATE TABLE IF NOT EXISTS mpesa_b2c_results (
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
CREATE INDEX IF NOT EXISTS idx_mpesa_b2c_results_user_id ON mpesa_b2c_results(user_id);
CREATE INDEX IF NOT EXISTS idx_mpesa_b2c_results_status ON mpesa_b2c_results(status);
