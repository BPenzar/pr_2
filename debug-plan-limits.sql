-- =============================================================================
-- DEBUG PLAN LIMITS ISSUE
-- =============================================================================
-- Run these queries in Supabase SQL Editor to debug why you can't create projects
-- =============================================================================

-- 1. Check if your account was created properly
SELECT
    a.id as account_id,
    a.user_id,
    a.name as account_name,
    p.name as plan_name,
    p.max_projects,
    p.max_forms_per_project,
    p.max_responses_per_form
FROM accounts a
JOIN plans p ON a.plan_id = p.id
ORDER BY a.created_at DESC;

-- 2. Check all available plans
SELECT
    id,
    name,
    price,
    max_projects,
    max_forms_per_project,
    max_responses_per_form,
    is_active
FROM plans
ORDER BY price;

-- 3. Check how many projects you currently have
SELECT
    a.name as account_name,
    COUNT(pr.id) as current_projects,
    p.max_projects as allowed_projects
FROM accounts a
LEFT JOIN projects pr ON a.id = pr.account_id AND pr.is_active = true
JOIN plans p ON a.plan_id = p.id
GROUP BY a.id, a.name, p.max_projects
ORDER BY a.created_at DESC;

-- 4. Test the can_create_project function directly
-- Replace 'YOUR_ACCOUNT_ID' with your actual account ID from query 1
DO $$
DECLARE
    user_account_id UUID;
    can_create BOOLEAN;
BEGIN
    -- Get the current user's account ID
    SELECT id INTO user_account_id FROM accounts WHERE user_id = auth.uid() LIMIT 1;

    IF user_account_id IS NOT NULL THEN
        -- Test the function
        SELECT can_create_project(user_account_id) INTO can_create;

        RAISE NOTICE 'Account ID: %', user_account_id;
        RAISE NOTICE 'Can create project: %', can_create;
    ELSE
        RAISE NOTICE 'No account found for current user!';
    END IF;
END $$;

-- 5. Check if there are any inactive projects
SELECT
    a.name as account_name,
    pr.name as project_name,
    pr.is_active,
    pr.created_at
FROM accounts a
LEFT JOIN projects pr ON a.id = pr.account_id
ORDER BY a.created_at DESC, pr.created_at DESC;

-- 6. Manual test of plan limits logic
SELECT
    a.id as account_id,
    a.name as account_name,
    COUNT(pr.id) FILTER (WHERE pr.is_active = true) as active_projects,
    p.max_projects,
    CASE
        WHEN p.max_projects = -1 THEN 'UNLIMITED'
        WHEN COUNT(pr.id) FILTER (WHERE pr.is_active = true) < p.max_projects THEN 'CAN CREATE'
        ELSE 'LIMIT REACHED'
    END as status
FROM accounts a
LEFT JOIN projects pr ON a.id = pr.account_id
JOIN plans p ON a.plan_id = p.id
GROUP BY a.id, a.name, p.max_projects
ORDER BY a.created_at DESC;