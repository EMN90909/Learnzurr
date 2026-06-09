CREATE TABLE IF NOT EXISTS quiz_questions (
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
CREATE INDEX IF NOT EXISTS idx_quiz_questions_user_id ON quiz_questions(user_id);
CREATE INDEX IF NOT EXISTS idx_quiz_questions_status ON quiz_questions(status);
