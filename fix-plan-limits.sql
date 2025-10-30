-- =============================================================================
-- FIX PLAN LIMITS ISSUE
-- =============================================================================
-- Run this if the debug queries show problems with plans or account setup
-- =============================================================================

-- Fix 1: Ensure Free plan exists with correct limits
INSERT INTO plans (name, price, max_projects, max_forms_per_project, max_responses_per_form, features)
VALUES ('Free', 0, 1, 3, 50, '["basic_analytics", "qr_codes"]')
ON CONFLICT (name) DO UPDATE SET
    max_projects = 1,
    max_forms_per_project = 3,
    max_responses_per_form = 50,
    is_active = true;

-- Fix 2: Ensure your account exists and is on Free plan
DO $$
DECLARE
    free_plan_id UUID;
    user_account_id UUID;
    current_user_id UUID;
BEGIN
    -- Get current user ID
    SELECT auth.uid() INTO current_user_id;

    IF current_user_id IS NULL THEN
        RAISE NOTICE 'No authenticated user found. Please log in first.';
        RETURN;
    END IF;

    -- Get Free plan ID
    SELECT id INTO free_plan_id FROM plans WHERE name = 'Free' LIMIT 1;

    -- Check if account exists for current user
    SELECT id INTO user_account_id FROM accounts WHERE user_id = current_user_id;

    IF user_account_id IS NULL THEN
        -- Create account if it doesn't exist
        INSERT INTO accounts (user_id, name, plan_id)
        VALUES (
            current_user_id,
            COALESCE(
                (SELECT raw_user_meta_data->>'full_name' FROM auth.users WHERE id = current_user_id),
                (SELECT email FROM auth.users WHERE id = current_user_id),
                'New User'
            ),
            free_plan_id
        )
        RETURNING id INTO user_account_id;

        RAISE NOTICE 'Created new account with ID: % on Free plan', user_account_id;
    ELSE
        -- Update existing account to Free plan
        UPDATE accounts
        SET plan_id = free_plan_id
        WHERE id = user_account_id;

        RAISE NOTICE 'Updated account % to Free plan', user_account_id;
    END IF;
END $$;

-- Fix 3: Clean up any test projects that might be counting against limit
-- UNCOMMENT the following if you want to delete any existing projects:
/*
DELETE FROM projects
WHERE account_id IN (
    SELECT id FROM accounts WHERE user_id = auth.uid()
);
RAISE NOTICE 'Cleaned up existing projects';
*/

-- Fix 4: Test the fix
DO $$
DECLARE
    user_account_id UUID;
    can_create BOOLEAN;
    current_projects INTEGER;
    max_allowed INTEGER;
BEGIN
    -- Get account info
    SELECT a.id, COUNT(p.id), pl.max_projects
    INTO user_account_id, current_projects, max_allowed
    FROM accounts a
    LEFT JOIN projects p ON a.id = p.account_id AND p.is_active = true
    JOIN plans pl ON a.plan_id = pl.id
    WHERE a.user_id = auth.uid()
    GROUP BY a.id, pl.max_projects;

    -- Test the function
    SELECT can_create_project(user_account_id) INTO can_create;

    RAISE NOTICE '=== PLAN LIMITS FIX RESULTS ===';
    RAISE NOTICE 'Account ID: %', user_account_id;
    RAISE NOTICE 'Current projects: %', current_projects;
    RAISE NOTICE 'Max allowed: %', max_allowed;
    RAISE NOTICE 'Can create project: %', can_create;

    IF can_create THEN
        RAISE NOTICE '✅ SUCCESS: You should now be able to create projects!';
    ELSE
        RAISE NOTICE '❌ STILL BLOCKED: Something else is wrong.';
    END IF;
END $$;