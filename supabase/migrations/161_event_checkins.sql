CREATE TABLE IF NOT EXISTS event_checkins (
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
CREATE INDEX IF NOT EXISTS idx_event_checkins_user_id ON event_checkins(user_id);
CREATE INDEX IF NOT EXISTS idx_event_checkins_status ON event_checkins(status);
