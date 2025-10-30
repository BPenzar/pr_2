-- =============================================================================
-- Missing Database Functions Fix
-- =============================================================================
-- This script creates all the missing functions that the application calls
-- =============================================================================

-- Function 1: Check if account can create more projects
CREATE OR REPLACE FUNCTION can_create_project(account_uuid UUID)
RETURNS BOOLEAN AS $$
DECLARE
    current_count INTEGER;
    max_allowed INTEGER;
BEGIN
    -- Get current project count for account
    SELECT COUNT(*) INTO current_count
    FROM projects
    WHERE account_id = account_uuid AND is_active = true;

    -- Get max projects allowed from plan
    SELECT p.max_projects INTO max_allowed
    FROM accounts a
    JOIN plans p ON a.plan_id = p.id
    WHERE a.id = account_uuid;

    -- If max_allowed is -1, it means unlimited
    IF max_allowed = -1 THEN
        RETURN true;
    END IF;

    -- Check if under limit
    RETURN current_count < max_allowed;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function 2: Check if project can create more forms
CREATE OR REPLACE FUNCTION can_create_form(project_uuid UUID)
RETURNS BOOLEAN AS $$
DECLARE
    current_count INTEGER;
    max_allowed INTEGER;
    account_id_val UUID;
BEGIN
    -- Get account ID from project
    SELECT account_id INTO account_id_val
    FROM projects
    WHERE id = project_uuid;

    -- Get current form count for project
    SELECT COUNT(*) INTO current_count
    FROM forms
    WHERE project_id = project_uuid AND is_active = true;

    -- Get max forms per project allowed from plan
    SELECT p.max_forms_per_project INTO max_allowed
    FROM accounts a
    JOIN plans p ON a.plan_id = p.id
    WHERE a.id = account_id_val;

    -- If max_allowed is -1, it means unlimited
    IF max_allowed = -1 THEN
        RETURN true;
    END IF;

    -- Check if under limit
    RETURN current_count < max_allowed;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function 3: Check if form can accept more responses
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
    FROM forms f
    JOIN projects p ON f.project_id = p.id
    WHERE f.id = form_uuid;

    -- Form must be active
    IF NOT form_active THEN
        RETURN false;
    END IF;

    -- Get current response count for form
    SELECT COUNT(*) INTO current_count
    FROM responses
    WHERE form_id = form_uuid;

    -- Get max responses per form allowed from plan
    SELECT p.max_responses_per_form INTO max_allowed
    FROM accounts a
    JOIN plans p ON a.plan_id = p.id
    WHERE a.id = account_id_val;

    -- If max_allowed is -1, it means unlimited
    IF max_allowed = -1 THEN
        RETURN true;
    END IF;

    -- Check if under limit
    RETURN current_count < max_allowed;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function 4: Increment QR code scan count
CREATE OR REPLACE FUNCTION increment_qr_scan(qr_code_uuid UUID)
RETURNS VOID AS $$
BEGIN
    UPDATE qr_codes
    SET scan_count = scan_count + 1
    WHERE id = qr_code_uuid;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function 5: Get account response count for a time period
CREATE OR REPLACE FUNCTION get_account_responses_count(
    account_uuid UUID,
    start_date TIMESTAMP WITH TIME ZONE DEFAULT NULL
)
RETURNS INTEGER AS $$
DECLARE
    response_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO response_count
    FROM responses r
    JOIN forms f ON r.form_id = f.id
    JOIN projects p ON f.project_id = p.id
    WHERE p.account_id = account_uuid
        AND (start_date IS NULL OR r.submitted_at >= start_date);

    RETURN COALESCE(response_count, 0);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function 6: Get user's account ID helper (already exists but ensuring it's there)
CREATE OR REPLACE FUNCTION get_user_account_id()
RETURNS UUID AS $$
BEGIN
    RETURN (
        SELECT id FROM accounts
        WHERE user_id = auth.uid()
        LIMIT 1
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function 7: Generate unique short URL for QR codes (already exists but ensuring it's there)
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

        SELECT EXISTS(SELECT 1 FROM qr_codes WHERE short_url = result) INTO url_exists;
    END LOOP;

    RETURN result;
END;
$$ LANGUAGE plpgsql;

-- Verification: Test the functions
DO $$
DECLARE
    test_account_id UUID;
    test_project_id UUID;
    test_form_id UUID;
    can_project BOOLEAN;
    can_form BOOLEAN;
    can_response BOOLEAN;
    response_count INTEGER;
BEGIN
    RAISE NOTICE '=== TESTING CREATED FUNCTIONS ===';

    -- Get a test account
    SELECT id INTO test_account_id FROM accounts LIMIT 1;

    IF test_account_id IS NOT NULL THEN
        RAISE NOTICE 'Testing with account ID: %', test_account_id;

        -- Test can_create_project
        SELECT can_create_project(test_account_id) INTO can_project;
        RAISE NOTICE 'can_create_project: %', can_project;

        -- Get a test project
        SELECT id INTO test_project_id FROM projects WHERE account_id = test_account_id LIMIT 1;

        IF test_project_id IS NOT NULL THEN
            -- Test can_create_form
            SELECT can_create_form(test_project_id) INTO can_form;
            RAISE NOTICE 'can_create_form: %', can_form;

            -- Get a test form
            SELECT id INTO test_form_id FROM forms WHERE project_id = test_project_id LIMIT 1;

            IF test_form_id IS NOT NULL THEN
                -- Test can_accept_response
                SELECT can_accept_response(test_form_id) INTO can_response;
                RAISE NOTICE 'can_accept_response: %', can_response;
            END IF;
        END IF;

        -- Test get_account_responses_count
        SELECT get_account_responses_count(test_account_id) INTO response_count;
        RAISE NOTICE 'Total responses for account: %', response_count;

    ELSE
        RAISE NOTICE 'No accounts found - functions created but not tested';
    END IF;

    RAISE NOTICE '=== ALL FUNCTIONS CREATED SUCCESSFULLY ===';
END $$;