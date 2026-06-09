CREATE TABLE IF NOT EXISTS search_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid,
  query text NOT NULL,
  result_count integer DEFAULT 0,
  zero_result boolean DEFAULT false,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_search_logs_query ON search_logs(query);
