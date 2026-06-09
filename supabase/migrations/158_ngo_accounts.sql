CREATE TABLE IF NOT EXISTS ngo_accounts (
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
CREATE INDEX IF NOT EXISTS idx_ngo_accounts_user_id ON ngo_accounts(user_id);
CREATE INDEX IF NOT EXISTS idx_ngo_accounts_status ON ngo_accounts(status);
