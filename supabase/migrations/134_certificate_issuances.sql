CREATE TABLE IF NOT EXISTS certificate_issuances (
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
CREATE INDEX IF NOT EXISTS idx_certificate_issuances_user_id ON certificate_issuances(user_id);
CREATE INDEX IF NOT EXISTS idx_certificate_issuances_status ON certificate_issuances(status);
