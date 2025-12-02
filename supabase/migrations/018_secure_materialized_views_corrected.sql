-- Secure materialized views by removing anonymous access
-- Note: RLS is not supported on materialized views in PostgreSQL

-- Remove access from anonymous users (they should not see analytics)
REVOKE SELECT ON dashboard_summary FROM anon;
REVOKE SELECT ON form_analytics FROM anon;
REVOKE SELECT ON response_trends FROM anon;

-- Keep authenticated access but create secure accessor functions
-- These functions will check permissions properly

-- Secure function to get dashboard summary
CREATE OR REPLACE FUNCTION get_user_dashboard_summary()
RETURNS SETOF dashboard_summary AS $$
BEGIN
  RETURN QUERY
  SELECT * FROM dashboard_summary
  WHERE account_id = get_user_account_id();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER
SET search_path = 'public';

-- Secure function to get form analytics
CREATE OR REPLACE FUNCTION get_user_form_analytics()
RETURNS SETOF form_analytics AS $$
BEGIN
  RETURN QUERY
  SELECT * FROM form_analytics
  WHERE account_id = get_user_account_id();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER
SET search_path = 'public';

-- Secure function to get response trends
CREATE OR REPLACE FUNCTION get_user_response_trends()
RETURNS SETOF response_trends AS $$
BEGIN
  RETURN QUERY
  SELECT * FROM response_trends
  WHERE account_id = get_user_account_id();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER
SET search_path = 'public';

-- Grant execute permissions to authenticated users only
GRANT EXECUTE ON FUNCTION get_user_dashboard_summary() TO authenticated;
GRANT EXECUTE ON FUNCTION get_user_form_analytics() TO authenticated;
GRANT EXECUTE ON FUNCTION get_user_response_trends() TO authenticated;