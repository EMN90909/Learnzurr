CREATE TABLE IF NOT EXISTS mearn_audit (
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
CREATE INDEX IF NOT EXISTS idx_mearn_audit_user_id ON mearn_audit(user_id);
CREATE INDEX IF NOT EXISTS idx_mearn_audit_status ON mearn_audit(status);
