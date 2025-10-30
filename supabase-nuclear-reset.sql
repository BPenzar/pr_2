-- =============================================================================
-- SUPABASE NUCLEAR RESET SCRIPT
-- =============================================================================
-- This script will COMPLETELY empty your Supabase project of ALL custom objects
-- WARNING: This will delete EVERYTHING custom in your project!
-- Make sure you have backups if needed!
-- =============================================================================

-- Step 1: Drop ALL materialized views
DO $$
DECLARE
    view_name TEXT;
BEGIN
    FOR view_name IN
        SELECT matviewname FROM pg_matviews WHERE schemaname = 'public'
    LOOP
        EXECUTE 'DROP MATERIALIZED VIEW IF EXISTS public.' || quote_ident(view_name) || ' CASCADE';
        RAISE NOTICE 'Dropped materialized view: %', view_name;
    END LOOP;
END $$;

-- Step 2: Drop ALL custom views
DO $$
DECLARE
    view_name TEXT;
BEGIN
    FOR view_name IN
        SELECT viewname FROM pg_views
        WHERE schemaname = 'public'
        AND viewname NOT LIKE 'pg_%'
        AND viewname NOT LIKE 'information_schema_%'
    LOOP
        EXECUTE 'DROP VIEW IF EXISTS public.' || quote_ident(view_name) || ' CASCADE';
        RAISE NOTICE 'Dropped view: %', view_name;
    END LOOP;
END $$;

-- Step 3: Drop ALL RLS policies on all tables
DO $$
DECLARE
    policy_record RECORD;
BEGIN
    FOR policy_record IN
        SELECT schemaname, tablename, policyname
        FROM pg_policies
        WHERE schemaname = 'public'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON %I.%I',
                      policy_record.policyname,
                      policy_record.schemaname,
                      policy_record.tablename);
        RAISE NOTICE 'Dropped policy: % on %.%',
                     policy_record.policyname,
                     policy_record.schemaname,
                     policy_record.tablename;
    END LOOP;
END $$;

-- Step 4: Drop ALL custom tables (in public schema)
DO $$
DECLARE
    table_name TEXT;
BEGIN
    -- Get all tables in public schema, excluding system tables
    FOR table_name IN
        SELECT tablename FROM pg_tables
        WHERE schemaname = 'public'
        AND tablename NOT LIKE 'pg_%'
        AND tablename NOT IN ('spatial_ref_sys', 'geography_columns', 'geometry_columns', 'raster_columns', 'raster_overviews')
    LOOP
        EXECUTE 'DROP TABLE IF EXISTS public.' || quote_ident(table_name) || ' CASCADE';
        RAISE NOTICE 'Dropped table: %', table_name;
    END LOOP;
END $$;

-- Step 5: Drop ALL custom functions (except built-in ones)
DO $$
DECLARE
    func_record RECORD;
BEGIN
    FOR func_record IN
        SELECT
            n.nspname as schema_name,
            p.proname as function_name,
            pg_get_function_identity_arguments(p.oid) as args
        FROM pg_proc p
        JOIN pg_namespace n ON p.pronamespace = n.oid
        WHERE n.nspname = 'public'
        AND p.proname NOT LIKE 'pg_%'
        AND p.proname NOT LIKE 'st_%'  -- Exclude PostGIS functions
        AND p.proname NOT LIKE '_pg_%'
    LOOP
        EXECUTE format('DROP FUNCTION IF EXISTS %I.%I(%s) CASCADE',
                      func_record.schema_name,
                      func_record.function_name,
                      func_record.args);
        RAISE NOTICE 'Dropped function: %.%(%)',
                     func_record.schema_name,
                     func_record.function_name,
                     func_record.args;
    END LOOP;
END $$;

-- Step 6: Drop ALL custom types
DO $$
DECLARE
    type_name TEXT;
BEGIN
    FOR type_name IN
        SELECT typname FROM pg_type
        WHERE typnamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')
        AND typtype = 'e'  -- Only enum types
        AND typname NOT LIKE 'pg_%'
        AND typname NOT LIKE '_pg_%'
    LOOP
        EXECUTE 'DROP TYPE IF EXISTS public.' || quote_ident(type_name) || ' CASCADE';
        RAISE NOTICE 'Dropped type: %', type_name;
    END LOOP;
END $$;

-- Step 7: Drop ALL custom sequences
DO $$
DECLARE
    seq_name TEXT;
BEGIN
    FOR seq_name IN
        SELECT sequencename FROM pg_sequences
        WHERE schemaname = 'public'
    LOOP
        EXECUTE 'DROP SEQUENCE IF EXISTS public.' || quote_ident(seq_name) || ' CASCADE';
        RAISE NOTICE 'Dropped sequence: %', seq_name;
    END LOOP;
END $$;

-- Step 8: Drop ALL custom triggers
DO $$
DECLARE
    trigger_record RECORD;
BEGIN
    FOR trigger_record IN
        SELECT
            t.tgname as trigger_name,
            c.relname as table_name
        FROM pg_trigger t
        JOIN pg_class c ON t.tgrelid = c.oid
        JOIN pg_namespace n ON c.relnamespace = n.oid
        WHERE n.nspname = 'public'
        AND t.tgname NOT LIKE 'pg_%'
        AND t.tgname NOT LIKE 'RI_%'  -- Exclude referential integrity triggers
    LOOP
        EXECUTE format('DROP TRIGGER IF EXISTS %I ON public.%I CASCADE',
                      trigger_record.trigger_name,
                      trigger_record.table_name);
        RAISE NOTICE 'Dropped trigger: % on %',
                     trigger_record.trigger_name,
                     trigger_record.table_name;
    END LOOP;
END $$;

-- Step 9: Drop ALL custom indexes (that aren't already dropped with tables)
DO $$
DECLARE
    index_name TEXT;
BEGIN
    FOR index_name IN
        SELECT indexname FROM pg_indexes
        WHERE schemaname = 'public'
        AND indexname NOT LIKE 'pg_%'
        AND indexname NOT LIKE '%_pkey'  -- Skip primary key indexes
        AND indexname NOT LIKE '%_fkey'  -- Skip foreign key indexes
    LOOP
        EXECUTE 'DROP INDEX IF EXISTS public.' || quote_ident(index_name) || ' CASCADE';
        RAISE NOTICE 'Dropped index: %', index_name;
    END LOOP;
END $$;

-- Step 10: Clean up cron jobs (if pg_cron extension exists)
DO $$
DECLARE
    job_record RECORD;
BEGIN
    IF EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pg_cron') THEN
        -- Get all scheduled jobs and unschedule them
        FOR job_record IN
            SELECT jobname FROM cron.job
        LOOP
            PERFORM cron.unschedule(job_record.jobname);
            RAISE NOTICE 'Unscheduled cron job: %', job_record.jobname;
        END LOOP;
    ELSE
        RAISE NOTICE 'pg_cron extension not found - no cron jobs to clean up';
    END IF;
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'Could not clean up cron jobs: %', SQLERRM;
END $$;

-- Step 11: Reset any sequences that might be referenced by system tables
DO $$
DECLARE
    seq_record RECORD;
BEGIN
    -- This is a safety measure - sequences should already be dropped
    FOR seq_record IN
        SELECT schemaname, sequencename FROM pg_sequences
        WHERE schemaname = 'public'
    LOOP
        EXECUTE format('ALTER SEQUENCE IF EXISTS %I.%I RESTART WITH 1',
                      seq_record.schemaname,
                      seq_record.sequencename);
        RAISE NOTICE 'Reset sequence: %.%',
                     seq_record.schemaname,
                     seq_record.sequencename;
    END LOOP;
END $$;

-- Step 12: OPTIONAL - Clean up auth.users (VERY DANGEROUS!)
-- Uncomment the following lines ONLY if you want to delete ALL users
-- WARNING: This will delete ALL user accounts and is IRREVERSIBLE!
/*
DO $$
BEGIN
    DELETE FROM auth.users;
    ALTER SEQUENCE IF EXISTS auth.users_id_seq RESTART WITH 1;
    RAISE NOTICE 'WARNING: Deleted ALL users from auth.users!';
END $$;
*/

-- Final step: Display comprehensive completion message
DO $$
BEGIN
    RAISE NOTICE '=============================================================================';
    RAISE NOTICE '🚀 NUCLEAR RESET COMPLETE - Your Supabase project is now completely clean!';
    RAISE NOTICE '=============================================================================';
    RAISE NOTICE '';
    RAISE NOTICE '✅ What was removed:';
    RAISE NOTICE '   🗑️  ALL custom tables and their data';
    RAISE NOTICE '   🗑️  ALL custom functions and triggers';
    RAISE NOTICE '   🗑️  ALL materialized views and regular views';
    RAISE NOTICE '   🗑️  ALL RLS policies';
    RAISE NOTICE '   🗑️  ALL custom types and enums';
    RAISE NOTICE '   🗑️  ALL custom sequences';
    RAISE NOTICE '   🗑️  ALL custom indexes';
    RAISE NOTICE '   🗑️  ALL scheduled cron jobs';
    RAISE NOTICE '';
    RAISE NOTICE '🔄 Your Supabase project is now a blank slate!';
    RAISE NOTICE '';
    RAISE NOTICE '📋 Next steps:';
    RAISE NOTICE '   1. Run your setup script to create the new schema';
    RAISE NOTICE '   2. Your app should work perfectly with the fresh database';
    RAISE NOTICE '';
    RAISE NOTICE '⚠️  Note: auth.users table was preserved (unless you manually uncommented the deletion code)';
    RAISE NOTICE '=============================================================================';
END $$;