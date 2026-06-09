CREATE TABLE IF NOT EXISTS classes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  teacher_id uuid,
  title text NOT NULL,
  subject text NOT NULL,
  price_cents integer NOT NULL DEFAULT 0,
  age_group text,
  status text DEFAULT 'draft',
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_classes_teacher_id ON classes(teacher_id);
CREATE INDEX IF NOT EXISTS idx_classes_subject ON classes(subject);
CREATE INDEX IF NOT EXISTS idx_classes_status ON classes(status);
