CREATE TABLE IF NOT EXISTS ngo_applications (
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
CREATE INDEX IF NOT EXISTS idx_ngo_applications_user_id ON ngo_applications(user_id);
CREATE INDEX IF NOT EXISTS idx_ngo_applications_status ON ngo_applications(status);
