CREATE TABLE IF NOT EXISTS gamfy_badges (
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
CREATE INDEX IF NOT EXISTS idx_gamfy_badges_user_id ON gamfy_badges(user_id);
CREATE INDEX IF NOT EXISTS idx_gamfy_badges_status ON gamfy_badges(status);
