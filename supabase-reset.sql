-- Supabase Project Reset Script
-- This script will completely empty your Supabase project, removing all custom tables, functions, and data
-- WARNING: This will delete ALL data in your project. Make sure you have backups if needed!

-- Drop materialized views first (they depend on tables)
DROP MATERIALIZED VIEW IF EXISTS dashboard_summary CASCADE;
DROP MATERIALIZED VIEW IF EXISTS form_analytics CASCADE;
DROP MATERIALIZED VIEW IF EXISTS response_trends CASCADE;

-- Drop all custom functions and triggers
DROP FUNCTION IF EXISTS can_create_project(UUID) CASCADE;
DROP FUNCTION IF EXISTS can_create_form(UUID) CASCADE;
DROP FUNCTION IF EXISTS can_accept_response(UUID) CASCADE;
DROP FUNCTION IF EXISTS increment_qr_scan(UUID) CASCADE;
DROP FUNCTION IF EXISTS get_account_responses_count(UUID) CASCADE;
DROP FUNCTION IF EXISTS get_user_account_id() CASCADE;
DROP FUNCTION IF EXISTS generate_short_url() CASCADE;
DROP FUNCTION IF EXISTS create_user_account() CASCADE;
DROP FUNCTION IF EXISTS update_updated_at_column() CASCADE;
DROP FUNCTION IF EXISTS refresh_dashboard_views() CASCADE;

-- Drop all custom tables in correct dependency order
DROP TABLE IF EXISTS response_items CASCADE;
DROP TABLE IF EXISTS responses CASCADE;
DROP TABLE IF EXISTS qr_codes CASCADE;
DROP TABLE IF EXISTS questions CASCADE;
DROP TABLE IF EXISTS forms CASCADE;
DROP TABLE IF EXISTS projects CASCADE;
DROP TABLE IF EXISTS usage_counters CASCADE;
DROP TABLE IF EXISTS subscriptions CASCADE;
DROP TABLE IF EXISTS audit_logs CASCADE;
DROP TABLE IF EXISTS accounts CASCADE;
DROP TABLE IF EXISTS plans CASCADE;

-- Drop custom types
DROP TYPE IF EXISTS question_type CASCADE;

-- Clean up any remaining policies (they should be automatically dropped with tables)
-- But we'll be explicit for safety
DO $$
DECLARE
    policy_record RECORD;
BEGIN
    -- Drop all RLS policies on remaining tables
    FOR policy_record IN
        SELECT schemaname, tablename, policyname
        FROM pg_policies
        WHERE schemaname = 'public'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON %I.%I',
                      policy_record.policyname,
                      policy_record.schemaname,
                      policy_record.tablename);
    END LOOP;
END $$;

-- Clean up any scheduled jobs (if pg_cron extension is enabled)
DO $$
BEGIN
    -- Only try to unschedule if pg_cron extension exists
    IF EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pg_cron') THEN
        PERFORM cron.unschedule('refresh-materialized-views');
        RAISE NOTICE 'Unscheduled cron job: refresh-materialized-views';
    ELSE
        RAISE NOTICE 'pg_cron extension not found - skipping cron job cleanup';
    END IF;
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'Could not unschedule cron job (this is normal if no job was scheduled): %', SQLERRM;
END $$;

-- Reset any sequences that might have been created
-- (This will be recreated when we run the setup script)

-- Optional: Reset auth.users if you want to remove all users too
-- UNCOMMENT the following lines if you want to delete all users as well
-- WARNING: This will delete ALL users from your project!
-- DELETE FROM auth.users;
-- ALTER SEQUENCE auth.users_id_seq RESTART WITH 1;

-- Display completion message
DO $$
BEGIN
    RAISE NOTICE '=============================================================================';
    RAISE NOTICE 'Supabase project has been successfully reset!';
    RAISE NOTICE 'All custom tables, functions, and data have been removed.';
    RAISE NOTICE '=============================================================================';
    RAISE NOTICE '';
    RAISE NOTICE 'What was removed:';
    RAISE NOTICE '  ✓ All custom tables and data';
    RAISE NOTICE '  ✓ All custom functions and triggers';
    RAISE NOTICE '  ✓ All materialized views';
    RAISE NOTICE '  ✓ All RLS policies';
    RAISE NOTICE '  ✓ All custom types';
    RAISE NOTICE '  ✓ All scheduled cron jobs';
    RAISE NOTICE '';
    RAISE NOTICE 'Your Supabase project is now clean and ready for a fresh setup!';
    RAISE NOTICE 'Run the setup script to recreate everything.';
END $$;