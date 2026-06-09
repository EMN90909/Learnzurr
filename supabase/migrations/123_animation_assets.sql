CREATE TABLE IF NOT EXISTS animation_assets (
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
CREATE INDEX IF NOT EXISTS idx_animation_assets_user_id ON animation_assets(user_id);
CREATE INDEX IF NOT EXISTS idx_animation_assets_status ON animation_assets(status);
