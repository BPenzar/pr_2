-- Materialized views for dashboard performance
-- As mentioned in PRD: "Materijalizirani pogledi za brzi dashboard"

-- Ensure pg_cron extension is available for scheduling background jobs
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Dashboard summary view for faster dashboard loading
CREATE MATERIALIZED VIEW dashboard_summary AS
SELECT
  p.account_id,
  p.id as project_id,
  p.name as project_name,
  COUNT(DISTINCT f.id) as forms_count,
  COUNT(DISTINCT r.id) as total_responses,
  COUNT(DISTINCT r.id) FILTER (WHERE r.submitted_at >= CURRENT_DATE - INTERVAL '7 days') as responses_last_7_days,
  COUNT(DISTINCT r.id) FILTER (WHERE r.submitted_at >= CURRENT_DATE - INTERVAL '30 days') as responses_last_30_days,
  COUNT(DISTINCT qr.id) as qr_codes_count,
  COALESCE(SUM(qr.scan_count), 0) as total_scans,
  MIN(r.submitted_at) as first_response_at,
  MAX(r.submitted_at) as latest_response_at
FROM projects p
LEFT JOIN forms f ON p.id = f.project_id AND f.is_active = true
LEFT JOIN qr_codes qr ON f.id = qr.form_id
LEFT JOIN responses r ON f.id = r.form_id
WHERE p.is_active = true
GROUP BY p.account_id, p.id, p.name;

-- Form analytics view
CREATE MATERIALIZED VIEW form_analytics AS
SELECT
  f.id as form_id,
  f.name as form_name,
  p.account_id,
  COUNT(DISTINCT r.id) as total_responses,
  COUNT(DISTINCT r.id) FILTER (WHERE r.submitted_at >= CURRENT_DATE - INTERVAL '7 days') as responses_last_7_days,
  COUNT(DISTINCT r.id) FILTER (WHERE r.submitted_at >= CURRENT_DATE - INTERVAL '30 days') as responses_last_30_days,
  COUNT(DISTINCT qr.id) as qr_codes_count,
  COALESCE(SUM(qr.scan_count), 0) as total_scans,
  MIN(r.submitted_at) as first_response_at,
  MAX(r.submitted_at) as latest_response_at,
  CASE
    WHEN COUNT(DISTINCT qr.id) > 0 AND SUM(qr.scan_count) > 0
    THEN ROUND((COUNT(DISTINCT r.id)::DECIMAL / SUM(qr.scan_count) * 100), 2)
    ELSE 0
  END as conversion_rate
FROM forms f
JOIN projects p ON f.project_id = p.id
LEFT JOIN qr_codes qr ON f.id = qr.form_id
LEFT JOIN responses r ON f.id = r.form_id
WHERE f.is_active = true AND p.is_active = true
GROUP BY f.id, f.name, p.account_id;

-- Response trends view (daily aggregates)
CREATE MATERIALIZED VIEW response_trends AS
SELECT
  p.account_id,
  f.id as form_id,
  DATE(r.submitted_at) as response_date,
  COUNT(*) as responses_count
FROM responses r
JOIN forms f ON r.form_id = f.id
JOIN projects p ON f.project_id = p.id
WHERE r.submitted_at >= CURRENT_DATE - INTERVAL '90 days'
GROUP BY p.account_id, f.id, DATE(r.submitted_at)
ORDER BY response_date DESC;

-- Create indexes on materialized views
CREATE INDEX idx_dashboard_summary_account_id ON dashboard_summary(account_id);
CREATE INDEX idx_form_analytics_account_id ON form_analytics(account_id);
CREATE INDEX idx_form_analytics_form_id ON form_analytics(form_id);
CREATE INDEX idx_response_trends_account_id ON response_trends(account_id);
CREATE INDEX idx_response_trends_form_id ON response_trends(form_id);
CREATE INDEX idx_response_trends_date ON response_trends(response_date);

-- Function to refresh materialized views
CREATE OR REPLACE FUNCTION refresh_dashboard_views()
RETURNS VOID AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY dashboard_summary;
  REFRESH MATERIALIZED VIEW CONCURRENTLY form_analytics;
  REFRESH MATERIALIZED VIEW CONCURRENTLY response_trends;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to be called by cron job (every 15 minutes)
-- Guard against duplicate job creation
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM cron.job WHERE jobname = 'refresh-dashboard-views'
  ) THEN
    PERFORM cron.schedule(
      'refresh-dashboard-views',
      '*/15 * * * *', -- Every 15 minutes
      'SELECT refresh_dashboard_views();'
    );
  END IF;
END;
$$;
