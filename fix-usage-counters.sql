-- =============================================================================
-- FIX USAGE COUNTERS ISSUE
-- =============================================================================
-- This will fix the incorrect usage_counters data that's blocking project creation
-- =============================================================================

-- Fix for your account specifically
DO $$
DECLARE
    user_account_id UUID;
    actual_projects INTEGER := 0;
    actual_forms INTEGER := 0;
    actual_responses INTEGER := 0;
    current_period_start DATE;
    current_period_end DATE;
BEGIN
    -- Get current user's account ID
    SELECT id INTO user_account_id FROM accounts WHERE user_id = auth.uid();

    IF user_account_id IS NULL THEN
        RAISE NOTICE 'No account found for current user!';
        RETURN;
    END IF;

    RAISE NOTICE 'Fixing usage counters for account: %', user_account_id;

    -- Calculate current usage period (this month)
    current_period_start := DATE_TRUNC('month', CURRENT_DATE);
    current_period_end := (DATE_TRUNC('month', CURRENT_DATE) + INTERVAL '1 month - 1 day')::DATE;

    -- Get actual counts from the database
    SELECT COUNT(*) INTO actual_projects
    FROM projects
    WHERE account_id = user_account_id AND is_active = true;

    SELECT COUNT(*) INTO actual_forms
    FROM forms f
    JOIN projects p ON f.project_id = p.id
    WHERE p.account_id = user_account_id AND f.is_active = true AND p.is_active = true;

    SELECT COUNT(*) INTO actual_responses
    FROM responses r
    JOIN forms f ON r.form_id = f.id
    JOIN projects p ON f.project_id = p.id
    WHERE p.account_id = user_account_id
    AND r.submitted_at >= current_period_start;

    RAISE NOTICE 'Actual counts - Projects: %, Forms: %, Responses: %', actual_projects, actual_forms, actual_responses;

    -- Delete any existing usage_counters entries for this account
    DELETE FROM usage_counters WHERE account_id = user_account_id;
    RAISE NOTICE 'Deleted old usage counter entries';

    -- Insert correct usage counter for current period
    INSERT INTO usage_counters (
        account_id,
        period_start,
        period_end,
        projects_count,
        forms_count,
        responses_count,
        qr_scans_count
    ) VALUES (
        user_account_id,
        current_period_start,
        current_period_end,
        actual_projects,
        actual_forms,
        actual_responses,
        0
    );

    RAISE NOTICE 'Created new usage counter with correct values';
    RAISE NOTICE 'Period: % to %', current_period_start, current_period_end;
    RAISE NOTICE 'Projects: % (should be 0)', actual_projects;

    -- Test the result
    DECLARE
        can_create BOOLEAN;
    BEGIN
        SELECT can_create_project(user_account_id) INTO can_create;
        RAISE NOTICE 'can_create_project result: %', can_create;

        IF can_create THEN
            RAISE NOTICE '✅ SUCCESS: Frontend should now allow project creation!';
        ELSE
            RAISE NOTICE '❌ Still blocked - check database function logic';
        END IF;
    END;
END $$;

-- Verify the fix by showing current state
SELECT
    'After Fix' as status,
    uc.projects_count as usage_counter_projects,
    COUNT(p.id) as actual_projects,
    pl.max_projects as plan_limit,
    CASE
        WHEN uc.projects_count < pl.max_projects THEN '✅ SHOULD WORK'
        ELSE '❌ STILL BLOCKED'
    END as frontend_status
FROM accounts a
LEFT JOIN usage_counters uc ON a.id = uc.account_id
LEFT JOIN projects p ON a.id = p.account_id AND p.is_active = true
JOIN plans pl ON a.plan_id = pl.id
WHERE a.user_id = auth.uid()
GROUP BY uc.projects_count, pl.max_projects;