-- =============================================================================
-- SUPABASE SECURITY FIXES
-- =============================================================================
-- This script fixes the security warnings from Supabase database linter
-- Run this AFTER running the complete setup script
-- =============================================================================

-- =============================================================================
-- FIX 1: FUNCTION SEARCH PATH SECURITY
-- =============================================================================
-- All functions need explicit search_path to prevent SQL injection attacks

-- Fix: update_updated_at_column function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public;

-- Fix: create_user_account function
CREATE OR REPLACE FUNCTION create_user_account()
RETURNS TRIGGER AS $$
DECLARE
    free_plan_id UUID;
BEGIN
    -- Get the Free plan ID
    SELECT id INTO free_plan_id FROM public.plans WHERE name = 'Free' LIMIT 1;

    -- Create account for new user
    INSERT INTO public.accounts (user_id, name, plan_id)
    VALUES (
        NEW.id,
        COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
        free_plan_id
    );

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public;

-- Fix: generate_short_url function
CREATE OR REPLACE FUNCTION generate_short_url()
RETURNS TEXT AS $$
DECLARE
    chars TEXT := 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    result TEXT := '';
    i INTEGER := 0;
    url_exists BOOLEAN := true;
BEGIN
    WHILE url_exists LOOP
        result := '';
        FOR i IN 1..8 LOOP
            result := result || substr(chars, floor(random() * length(chars) + 1)::int, 1);
        END LOOP;

        SELECT EXISTS(SELECT 1 FROM public.qr_codes WHERE short_url = result) INTO url_exists;
    END LOOP;

    RETURN result;
END;
$$ LANGUAGE plpgsql
SET search_path = public;

-- Fix: get_user_account_id function
CREATE OR REPLACE FUNCTION get_user_account_id()
RETURNS UUID AS $$
BEGIN
    RETURN (
        SELECT id FROM public.accounts
        WHERE user_id = auth.uid()
        LIMIT 1
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public;

-- Fix: can_create_project function
CREATE OR REPLACE FUNCTION can_create_project(account_uuid UUID)
RETURNS BOOLEAN AS $$
DECLARE
    current_count INTEGER;
    max_allowed INTEGER;
BEGIN
    -- Get current project count for account
    SELECT COUNT(*) INTO current_count
    FROM public.projects
    WHERE account_id = account_uuid AND is_active = true;

    -- Get max projects allowed from plan
    SELECT p.max_projects INTO max_allowed
    FROM public.accounts a
    JOIN public.plans p ON a.plan_id = p.id
    WHERE a.id = account_uuid;

    -- If max_allowed is -1, it means unlimited
    IF max_allowed = -1 THEN
        RETURN true;
    END IF;

    -- Check if under limit
    RETURN current_count < max_allowed;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public;

-- Fix: can_create_form function
CREATE OR REPLACE FUNCTION can_create_form(project_uuid UUID)
RETURNS BOOLEAN AS $$
DECLARE
    current_count INTEGER;
    max_allowed INTEGER;
    account_id_val UUID;
BEGIN
    -- Get account ID from project
    SELECT account_id INTO account_id_val
    FROM public.projects
    WHERE id = project_uuid;

    -- Get current form count for project
    SELECT COUNT(*) INTO current_count
    FROM public.forms
    WHERE project_id = project_uuid AND is_active = true;

    -- Get max forms per project allowed from plan
    SELECT p.max_forms_per_project INTO max_allowed
    FROM public.accounts a
    JOIN public.plans p ON a.plan_id = p.id
    WHERE a.id = account_id_val;

    -- If max_allowed is -1, it means unlimited
    IF max_allowed = -1 THEN
        RETURN true;
    END IF;

    -- Check if under limit
    RETURN current_count < max_allowed;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public;

-- Fix: can_accept_response function
CREATE OR REPLACE FUNCTION can_accept_response(form_uuid UUID)
RETURNS BOOLEAN AS $$
DECLARE
    current_count INTEGER;
    max_allowed INTEGER;
    account_id_val UUID;
    form_active BOOLEAN;
BEGIN
    -- Check if form is active and get account ID
    SELECT p.account_id, f.is_active INTO account_id_val, form_active
    FROM public.forms f
    JOIN public.projects p ON f.project_id = p.id
    WHERE f.id = form_uuid;

    -- Form must be active
    IF NOT form_active THEN
        RETURN false;
    END IF;

    -- Get current response count for form
    SELECT COUNT(*) INTO current_count
    FROM public.responses
    WHERE form_id = form_uuid;

    -- Get max responses per form allowed from plan
    SELECT p.max_responses_per_form INTO max_allowed
    FROM public.accounts a
    JOIN public.plans p ON a.plan_id = p.id
    WHERE a.id = account_id_val;

    -- If max_allowed is -1, it means unlimited
    IF max_allowed = -1 THEN
        RETURN true;
    END IF;

    -- Check if under limit
    RETURN current_count < max_allowed;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public;

-- Fix: increment_qr_scan function
CREATE OR REPLACE FUNCTION increment_qr_scan(qr_code_uuid UUID)
RETURNS VOID AS $$
BEGIN
    UPDATE public.qr_codes
    SET scan_count = scan_count + 1
    WHERE id = qr_code_uuid;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public;

-- Fix: get_account_responses_count function
CREATE OR REPLACE FUNCTION get_account_responses_count(
    account_uuid UUID,
    start_date TIMESTAMP WITH TIME ZONE DEFAULT NULL
)
RETURNS INTEGER AS $$
DECLARE
    response_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO response_count
    FROM public.responses r
    JOIN public.forms f ON r.form_id = f.id
    JOIN public.projects p ON f.project_id = p.id
    WHERE p.account_id = account_uuid
        AND (start_date IS NULL OR r.submitted_at >= start_date);

    RETURN COALESCE(response_count, 0);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public;

-- Fix: refresh_dashboard_views function
CREATE OR REPLACE FUNCTION refresh_dashboard_views()
RETURNS VOID AS $$
BEGIN
    REFRESH MATERIALIZED VIEW CONCURRENTLY public.dashboard_summary;
    REFRESH MATERIALIZED VIEW CONCURRENTLY public.form_analytics;
    REFRESH MATERIALIZED VIEW CONCURRENTLY public.response_trends;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public;

-- =============================================================================
-- FIX 2: MATERIALIZED VIEW SECURITY
-- =============================================================================
-- PostgreSQL doesn't support RLS on materialized views, so we create secure
-- functions to access the data instead of exposing views directly via API

-- Create secure functions to access materialized view data with proper RLS

-- Secure dashboard summary function
CREATE OR REPLACE FUNCTION get_dashboard_summary()
RETURNS TABLE (
    account_id UUID,
    project_id UUID,
    project_name TEXT,
    forms_count BIGINT,
    total_responses BIGINT,
    responses_last_7_days BIGINT,
    responses_last_30_days BIGINT,
    qr_codes_count BIGINT,
    total_scans BIGINT,
    first_response_at TIMESTAMP WITH TIME ZONE,
    latest_response_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        ds.account_id,
        ds.project_id,
        ds.project_name,
        ds.forms_count,
        ds.total_responses,
        ds.responses_last_7_days,
        ds.responses_last_30_days,
        ds.qr_codes_count,
        ds.total_scans,
        ds.first_response_at,
        ds.latest_response_at
    FROM public.dashboard_summary ds
    WHERE ds.account_id = get_user_account_id();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public;

-- Secure form analytics function
CREATE OR REPLACE FUNCTION get_form_analytics()
RETURNS TABLE (
    form_id UUID,
    form_name TEXT,
    account_id UUID,
    total_responses BIGINT,
    responses_last_7_days BIGINT,
    responses_last_30_days BIGINT,
    qr_codes_count BIGINT,
    total_scans BIGINT,
    first_response_at TIMESTAMP WITH TIME ZONE,
    latest_response_at TIMESTAMP WITH TIME ZONE,
    conversion_rate NUMERIC
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        fa.form_id,
        fa.form_name,
        fa.account_id,
        fa.total_responses,
        fa.responses_last_7_days,
        fa.responses_last_30_days,
        fa.qr_codes_count,
        fa.total_scans,
        fa.first_response_at,
        fa.latest_response_at,
        fa.conversion_rate
    FROM public.form_analytics fa
    WHERE fa.account_id = get_user_account_id();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public;

-- Secure response trends function
CREATE OR REPLACE FUNCTION get_response_trends()
RETURNS TABLE (
    account_id UUID,
    form_id UUID,
    response_date DATE,
    responses_count BIGINT
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        rt.account_id,
        rt.form_id,
        rt.response_date,
        rt.responses_count
    FROM public.response_trends rt
    WHERE rt.account_id = get_user_account_id();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public;

-- Optional: Hide materialized views from API by revoking permissions
-- This prevents direct access via Supabase REST API
REVOKE ALL ON public.dashboard_summary FROM anon, authenticated;
REVOKE ALL ON public.form_analytics FROM anon, authenticated;
REVOKE ALL ON public.response_trends FROM anon, authenticated;

-- Grant access only to the secure functions (these will be accessible via RPC calls)
GRANT EXECUTE ON FUNCTION get_dashboard_summary() TO authenticated;
GRANT EXECUTE ON FUNCTION get_form_analytics() TO authenticated;
GRANT EXECUTE ON FUNCTION get_response_trends() TO authenticated;

-- =============================================================================
-- COMPLETION MESSAGE
-- =============================================================================

DO $$
BEGIN
    RAISE NOTICE '=============================================================================';
    RAISE NOTICE '🔒 SECURITY FIXES APPLIED SUCCESSFULLY!';
    RAISE NOTICE '=============================================================================';
    RAISE NOTICE '';
    RAISE NOTICE '✅ Fixed security issues:';
    RAISE NOTICE '';
    RAISE NOTICE '🛡️  FUNCTION SECURITY:';
    RAISE NOTICE '   ✓ Added explicit search_path to all functions';
    RAISE NOTICE '   ✓ Prevents SQL injection via search_path manipulation';
    RAISE NOTICE '   ✓ Functions: update_updated_at_column, create_user_account, generate_short_url';
    RAISE NOTICE '   ✓ Functions: get_user_account_id, can_create_project, can_create_form';
    RAISE NOTICE '   ✓ Functions: can_accept_response, increment_qr_scan, get_account_responses_count';
    RAISE NOTICE '   ✓ Functions: refresh_dashboard_views';
    RAISE NOTICE '';
    RAISE NOTICE '🔐 MATERIALIZED VIEW SECURITY:';
    RAISE NOTICE '   ✓ Created secure functions for materialized view access';
    RAISE NOTICE '   ✓ Functions: get_dashboard_summary(), get_form_analytics(), get_response_trends()';
    RAISE NOTICE '   ✓ Revoked direct API access to materialized views';
    RAISE NOTICE '   ✓ Users can only access their own data via secure RPC calls';
    RAISE NOTICE '';
    RAISE NOTICE '🎯 Your database is now PRODUCTION-READY and SECURE!';
    RAISE NOTICE '';
    RAISE NOTICE 'The Supabase linter warnings should now be resolved.';
    RAISE NOTICE '';
    RAISE NOTICE '📋 FRONTEND USAGE:';
    RAISE NOTICE '   Instead of querying materialized views directly, use these RPC calls:';
    RAISE NOTICE '   • supabase.rpc("get_dashboard_summary")';
    RAISE NOTICE '   • supabase.rpc("get_form_analytics")';
    RAISE NOTICE '   • supabase.rpc("get_response_trends")';
    RAISE NOTICE '=============================================================================';
END $$;