-- =============================================================================
-- TEST THE EXACT FUNCTION CALL
-- =============================================================================
-- This will test the can_create_project function with your specific account ID
-- =============================================================================

-- Test with your specific account ID
SELECT can_create_project('43207b4e-7311-4f0e-b7f4-3c99c87ed9ab'::UUID) as can_create_result;

-- Also test the get_user_account_id function
SELECT get_user_account_id() as current_user_account_id;

-- Test both together (this is what your frontend should be doing)
SELECT can_create_project(get_user_account_id()) as frontend_should_get;

-- Debug the function step by step
DO $$
DECLARE
    account_uuid UUID := '43207b4e-7311-4f0e-b7f4-3c99c87ed9ab';
    current_count INTEGER;
    max_allowed INTEGER;
    can_create BOOLEAN;
BEGIN
    RAISE NOTICE '=== DEBUGGING can_create_project FUNCTION ===';
    RAISE NOTICE 'Testing with account ID: %', account_uuid;

    -- Step 1: Get current project count
    SELECT COUNT(*) INTO current_count
    FROM projects
    WHERE account_id = account_uuid AND is_active = true;

    RAISE NOTICE 'Current active projects: %', current_count;

    -- Step 2: Get max allowed from plan
    SELECT p.max_projects INTO max_allowed
    FROM accounts a
    JOIN plans p ON a.plan_id = p.id
    WHERE a.id = account_uuid;

    RAISE NOTICE 'Max projects allowed: %', max_allowed;

    -- Step 3: Check logic
    IF max_allowed = -1 THEN
        can_create := true;
        RAISE NOTICE 'Plan allows unlimited projects: TRUE';
    ELSE
        can_create := current_count < max_allowed;
        RAISE NOTICE 'Current (%) < Max (%): %', current_count, max_allowed, can_create;
    END IF;

    -- Step 4: Call actual function
    SELECT can_create_project(account_uuid) INTO can_create;
    RAISE NOTICE 'Function result: %', can_create;
END $$;