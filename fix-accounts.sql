-- =============================================================================
-- Fix Missing Accounts Issue
-- =============================================================================
-- This script creates missing account records for existing authenticated users
-- =============================================================================

-- Step 1: Check what users exist in auth.users but not in accounts
DO $$
DECLARE
    user_record RECORD;
    free_plan_id UUID;
    missing_accounts_count INTEGER := 0;
BEGIN
    -- Get the Free plan ID
    SELECT id INTO free_plan_id FROM plans WHERE name = 'Free' LIMIT 1;

    IF free_plan_id IS NULL THEN
        RAISE EXCEPTION 'Free plan not found! Make sure you ran the main setup script first.';
    END IF;

    RAISE NOTICE 'Free plan ID: %', free_plan_id;
    RAISE NOTICE 'Checking for users without accounts...';

    -- Find users in auth.users who don't have accounts
    FOR user_record IN
        SELECT
            u.id,
            u.email,
            u.raw_user_meta_data,
            u.created_at
        FROM auth.users u
        LEFT JOIN accounts a ON u.id = a.user_id
        WHERE a.user_id IS NULL
    LOOP
        missing_accounts_count := missing_accounts_count + 1;

        RAISE NOTICE 'Creating account for user: % (ID: %)', user_record.email, user_record.id;

        -- Create account for this user
        INSERT INTO accounts (user_id, name, plan_id)
        VALUES (
            user_record.id,
            COALESCE(
                user_record.raw_user_meta_data->>'full_name',
                user_record.raw_user_meta_data->>'name',
                user_record.email
            ),
            free_plan_id
        );

        RAISE NOTICE 'Account created successfully for: %', user_record.email;
    END LOOP;

    IF missing_accounts_count = 0 THEN
        RAISE NOTICE 'No missing accounts found. All users already have accounts.';
    ELSE
        RAISE NOTICE 'Created % missing account(s)', missing_accounts_count;
    END IF;
END $$;

-- Step 2: Verify the trigger function exists and is correct
CREATE OR REPLACE FUNCTION create_user_account()
RETURNS TRIGGER AS $$
DECLARE
    free_plan_id UUID;
BEGIN
    -- Get the Free plan ID
    SELECT id INTO free_plan_id FROM plans WHERE name = 'Free' LIMIT 1;

    IF free_plan_id IS NULL THEN
        RAISE EXCEPTION 'Free plan not found when creating account for user %', NEW.id;
    END IF;

    -- Create account for new user
    INSERT INTO accounts (user_id, name, plan_id)
    VALUES (
        NEW.id,
        COALESCE(
            NEW.raw_user_meta_data->>'full_name',
            NEW.raw_user_meta_data->>'name',
            NEW.email
        ),
        free_plan_id
    );

    RAISE NOTICE 'Auto-created account for user: % (ID: %)', NEW.email, NEW.id;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 3: Recreate the trigger to ensure it's active
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION create_user_account();

-- Step 4: Verify accounts and plans
DO $$
DECLARE
    total_users INTEGER;
    total_accounts INTEGER;
    total_plans INTEGER;
BEGIN
    SELECT COUNT(*) INTO total_users FROM auth.users;
    SELECT COUNT(*) INTO total_accounts FROM accounts;
    SELECT COUNT(*) INTO total_plans FROM plans;

    RAISE NOTICE '';
    RAISE NOTICE '=== VERIFICATION RESULTS ===';
    RAISE NOTICE 'Total users in auth.users: %', total_users;
    RAISE NOTICE 'Total accounts in accounts table: %', total_accounts;
    RAISE NOTICE 'Total plans available: %', total_plans;

    IF total_users = total_accounts THEN
        RAISE NOTICE '✅ SUCCESS: All users have accounts!';
    ELSE
        RAISE NOTICE '❌ MISMATCH: % users but % accounts', total_users, total_accounts;
    END IF;

    IF total_plans >= 1 THEN
        RAISE NOTICE '✅ Plans table has data';
    ELSE
        RAISE NOTICE '❌ Plans table is empty!';
    END IF;
END $$;

-- Step 5: Show current accounts and completion message
DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '=== SHOWING CURRENT ACCOUNTS ===';
END $$;

SELECT
    a.id as account_id,
    a.name as account_name,
    u.email as user_email,
    p.name as plan_name,
    a.created_at
FROM accounts a
JOIN auth.users u ON a.user_id = u.id
JOIN plans p ON a.plan_id = p.id
ORDER BY a.created_at DESC;

DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '=== ACCOUNT CREATION FIX COMPLETED ===';
    RAISE NOTICE 'If you see accounts listed above, the fix worked!';
    RAISE NOTICE 'Now restart your Next.js app and try logging in again.';
END $$;