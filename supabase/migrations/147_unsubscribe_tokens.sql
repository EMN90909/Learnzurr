CREATE TABLE IF NOT EXISTS unsubscribe_tokens (
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
CREATE INDEX IF NOT EXISTS idx_unsubscribe_tokens_user_id ON unsubscribe_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_unsubscribe_tokens_status ON unsubscribe_tokens(status);
