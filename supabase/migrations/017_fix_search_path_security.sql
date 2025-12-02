-- Fix search path security vulnerabilities for all database functions
-- This migration adds search_path = 'public' to all functions to prevent SQL injection

-- Fix update_updated_at_column
ALTER FUNCTION update_updated_at_column() SET search_path = 'public';

-- Fix get_user_account_id
ALTER FUNCTION get_user_account_id() SET search_path = 'public';

-- Fix generate_short_url
ALTER FUNCTION generate_short_url() SET search_path = 'public';

-- Fix create_user_account (already fixed in migration 008)
-- No action needed here

-- Fix can_create_project
ALTER FUNCTION can_create_project(UUID) SET search_path = 'public';

-- Fix can_create_form
ALTER FUNCTION can_create_form(UUID, UUID) SET search_path = 'public';

-- Fix can_accept_response
ALTER FUNCTION can_accept_response(UUID) SET search_path = 'public';

-- Fix update_usage_counters
ALTER FUNCTION update_usage_counters() SET search_path = 'public';

-- Fix log_audit_event (PostgreSQL function overload resolution)
ALTER FUNCTION log_audit_event(uuid, uuid, varchar, varchar, uuid, jsonb) SET search_path = 'public';

-- Fix increment_qr_scan
ALTER FUNCTION increment_qr_scan(UUID) SET search_path = 'public';

-- Fix refresh_dashboard_views
ALTER FUNCTION refresh_dashboard_views() SET search_path = 'public';

-- Fix reorder_questions
ALTER FUNCTION reorder_questions(UUID, UUID[], INTEGER[]) SET search_path = 'public';

-- Fix get_project_usage_summary (already fixed in migration 016)
-- No action needed here

-- Fix get_account_responses_count
ALTER FUNCTION get_account_responses_count(UUID, TIMESTAMPTZ) SET search_path = 'public';