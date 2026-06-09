CREATE TABLE IF NOT EXISTS storage_usage (
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
CREATE INDEX IF NOT EXISTS idx_storage_usage_user_id ON storage_usage(user_id);
CREATE INDEX IF NOT EXISTS idx_storage_usage_status ON storage_usage(status);
