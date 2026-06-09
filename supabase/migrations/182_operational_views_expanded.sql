-- Operational reporting views for Learnzur dashboards
CREATE OR REPLACE VIEW teacher_revenue_daily AS
SELECT date_trunc('day', created_at) AS day, count(*)::bigint AS total
FROM transactions
GROUP BY 1
ORDER BY 1 DESC;

CREATE OR REPLACE VIEW learner_progress_daily AS
SELECT date_trunc('day', created_at) AS day, count(*)::bigint AS total
FROM grades
GROUP BY 1
ORDER BY 1 DESC;

CREATE OR REPLACE VIEW moderation_pressure_daily AS
SELECT date_trunc('day', created_at) AS day, count(*)::bigint AS total
FROM flag_records
GROUP BY 1
ORDER BY 1 DESC;

CREATE OR REPLACE VIEW notification_health_daily AS
SELECT date_trunc('day', created_at) AS day, count(*)::bigint AS total
FROM notification_logs
GROUP BY 1
ORDER BY 1 DESC;

CREATE OR REPLACE VIEW marketplace_velocity_daily AS
SELECT date_trunc('day', created_at) AS day, count(*)::bigint AS total
FROM lanmat_purchases
GROUP BY 1
ORDER BY 1 DESC;

CREATE OR REPLACE VIEW classroom_attendance_health_daily AS
SELECT date_trunc('day', created_at) AS day, count(*)::bigint AS total
FROM classroom_attendance
GROUP BY 1
ORDER BY 1 DESC;

-- Dashboard refresh function scheduled implementation hook for cron/worker triggered refreshes
CREATE OR REPLACE FUNCTION refresh_learnzur_dashboard_snapshots()
RETURNS void AS $$
BEGIN
  INSERT INTO audit_logs (action, metadata)
  VALUES ('dashboard.refresh', jsonb_build_object('source','182_operational_views_expanded'));
END;
$$ LANGUAGE plpgsql;
