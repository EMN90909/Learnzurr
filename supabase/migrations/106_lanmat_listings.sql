CREATE TABLE IF NOT EXISTS lanmat_listings (
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
CREATE INDEX IF NOT EXISTS idx_lanmat_listings_user_id ON lanmat_listings(user_id);
CREATE INDEX IF NOT EXISTS idx_lanmat_listings_status ON lanmat_listings(status);
