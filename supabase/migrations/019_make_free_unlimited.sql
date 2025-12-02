-- Make the Free plan unlimited and disable paid plan listings.

INSERT INTO plans (name, price, max_projects, max_forms_per_project, max_responses_per_form, features, is_active)
VALUES ('Free', 0, -1, -1, -1, '["advanced_analytics", "qr_codes", "export_csv", "custom_branding", "unlimited_usage"]', true)
ON CONFLICT (name) DO UPDATE
SET price = 0,
    max_projects = -1,
    max_forms_per_project = -1,
    max_responses_per_form = -1,
    features = EXCLUDED.features,
    is_active = true,
    updated_at = NOW();

UPDATE plans
SET is_active = false,
    updated_at = NOW()
WHERE name <> 'Free';

-- Keep the create_user_account safety net aligned with unlimited Free plan defaults.
CREATE OR REPLACE FUNCTION create_user_account()
RETURNS TRIGGER AS $$
DECLARE
    free_plan_id UUID;
    new_account_id UUID;
    current_period_start DATE;
    current_period_end DATE;
    user_name TEXT;
BEGIN
    SELECT id
      INTO free_plan_id
      FROM plans
     WHERE name = 'Free'
     LIMIT 1;

    IF free_plan_id IS NULL THEN
        INSERT INTO plans (
            name,
            price,
            max_projects,
            max_forms_per_project,
            max_responses_per_form,
            features,
            is_active
        )
        VALUES (
            'Free',
            0,
            -1,
            -1,
            -1,
            '["basic_analytics", "qr_codes"]',
            true
        )
        ON CONFLICT (name) DO UPDATE
            SET price = EXCLUDED.price,
                max_projects = EXCLUDED.max_projects,
                max_forms_per_project = EXCLUDED.max_forms_per_project,
                max_responses_per_form = EXCLUDED.max_responses_per_form,
                features = EXCLUDED.features,
                is_active = true,
                updated_at = NOW()
        RETURNING id INTO free_plan_id;
    ELSE
        UPDATE plans
        SET price = 0,
            max_projects = -1,
            max_forms_per_project = -1,
            max_responses_per_form = -1,
            is_active = true,
            updated_at = NOW()
        WHERE id = free_plan_id;
    END IF;

    user_name := COALESCE(
        NEW.raw_user_meta_data->>'full_name',
        NEW.raw_user_meta_data->>'name',
        NEW.email,
        'User'
    );

    INSERT INTO accounts (user_id, name, plan_id)
    VALUES (NEW.id, user_name, free_plan_id)
    RETURNING id INTO new_account_id;

    current_period_start := DATE_TRUNC('month', CURRENT_DATE);
    current_period_end := (DATE_TRUNC('month', CURRENT_DATE) + INTERVAL '1 month - 1 day')::DATE;

    INSERT INTO usage_counters (
        account_id,
        period_start,
        period_end,
        projects_count,
        forms_count,
        responses_count,
        qr_scans_count
    ) VALUES (
        new_account_id,
        current_period_start,
        current_period_end,
        0, 0, 0, 0
    );

    RETURN NEW;

EXCEPTION
    WHEN OTHERS THEN
        RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER
SET search_path = 'public';
