-- Expanded Learnzur seed data, RLS helpers and operational indexes
INSERT INTO subjects (name, slug, metadata) VALUES
('Mathematics','mathematics', '{}'::jsonb),
('English','english', '{}'::jsonb),
('Science','science', '{}'::jsonb),
('Kiswahili','kiswahili', '{}'::jsonb),
('Physics','physics', '{}'::jsonb),
('Chemistry','chemistry', '{}'::jsonb),
('Biology','biology', '{}'::jsonb),
('History','history', '{}'::jsonb),
('Geography','geography', '{}'::jsonb),
('Coding','coding', '{}'::jsonb),
('Art','art', '{}'::jsonb),
('Music','music', '{}'::jsonb)
ON CONFLICT DO NOTHING;

INSERT INTO counties (name, metadata) VALUES
('Nairobi', '{}'::jsonb),
('Mombasa', '{}'::jsonb),
('Kisumu', '{}'::jsonb),
('Nakuru', '{}'::jsonb),
('Kiambu', '{}'::jsonb),
('Kajiado', '{}'::jsonb),
('Machakos', '{}'::jsonb),
('Uasin Gishu', '{}'::jsonb),
('Bungoma', '{}'::jsonb),
('Kakamega', '{}'::jsonb),
('Nyeri', '{}'::jsonb),
('Meru', '{}'::jsonb),
('Kilifi', '{}'::jsonb),
('Siaya', '{}'::jsonb),
('Busia', '{}'::jsonb),
('Trans Nzoia', '{}'::jsonb),
('Nyandarua', '{}'::jsonb),
('Murang’a', '{}'::jsonb),
('Kirinyaga', '{}'::jsonb),
('Embu', '{}'::jsonb),
('Tharaka Nithi', '{}'::jsonb),
('Kitui', '{}'::jsonb),
('Makueni', '{}'::jsonb),
('Taita Taveta', '{}'::jsonb),
('Kwale', '{}'::jsonb),
('Lamu', '{}'::jsonb),
('Garissa', '{}'::jsonb),
('Wajir', '{}'::jsonb),
('Mandera', '{}'::jsonb),
('Marsabit', '{}'::jsonb),
('Isiolo', '{}'::jsonb),
('Laikipia', '{}'::jsonb),
('Samburu', '{}'::jsonb),
('Baringo', '{}'::jsonb),
('Elgeyo Marakwet', '{}'::jsonb),
('Nandi', '{}'::jsonb),
('Kericho', '{}'::jsonb),
('Bomet', '{}'::jsonb),
('Narok', '{}'::jsonb),
('Homa Bay', '{}'::jsonb),
('Migori', '{}'::jsonb),
('Kisii', '{}'::jsonb),
('Nyamira', '{}'::jsonb),
('Turkana', '{}'::jsonb),
('West Pokot', '{}'::jsonb),
('Vihiga', '{}'::jsonb),
('Tana River', '{}'::jsonb)
ON CONFLICT DO NOTHING;

CREATE INDEX IF NOT EXISTS idx_users_created_at_desc ON users (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_users_metadata_gin ON users USING gin (metadata) WHERE metadata IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_classes_created_at_desc ON classes (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_classes_metadata_gin ON classes USING gin (metadata) WHERE metadata IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_enrollments_created_at_desc ON enrollments (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_enrollments_metadata_gin ON enrollments USING gin (metadata) WHERE metadata IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_transactions_created_at_desc ON transactions (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_transactions_metadata_gin ON transactions USING gin (metadata) WHERE metadata IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_quiz_submissions_created_at_desc ON quiz_submissions (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_quiz_submissions_metadata_gin ON quiz_submissions USING gin (metadata) WHERE metadata IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_assignment_submissions_created_at_desc ON assignment_submissions (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_assignment_submissions_metadata_gin ON assignment_submissions USING gin (metadata) WHERE metadata IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_gamfy_points_created_at_desc ON gamfy_points (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_gamfy_points_metadata_gin ON gamfy_points USING gin (metadata) WHERE metadata IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_lanmat_listings_created_at_desc ON lanmat_listings (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_lanmat_listings_metadata_gin ON lanmat_listings USING gin (metadata) WHERE metadata IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_flag_records_created_at_desc ON flag_records (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_flag_records_metadata_gin ON flag_records USING gin (metadata) WHERE metadata IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_notification_logs_created_at_desc ON notification_logs (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notification_logs_metadata_gin ON notification_logs USING gin (metadata) WHERE metadata IS NOT NULL;

CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION audit_no_update_delete()
RETURNS trigger AS $$
BEGIN
  RAISE EXCEPTION 'audit tables are append-only';
END;
$$ LANGUAGE plpgsql;
