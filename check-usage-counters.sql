-- =============================================================================
-- CHECK USAGE COUNTERS TABLE
-- =============================================================================
-- This will show the problematic data in usage_counters
-- =============================================================================

-- Check usage_counters for your account
SELECT
    uc.account_id,
    uc.period_start,
    uc.period_end,
    uc.projects_count as recorded_projects,
    uc.forms_count as recorded_forms,
    uc.responses_count as recorded_responses,
    uc.qr_scans_count as recorded_scans,
    uc.created_at,
    uc.updated_at
FROM usage_counters uc
JOIN accounts a ON uc.account_id = a.id
WHERE a.user_id = auth.uid()
ORDER BY uc.period_start DESC;

-- Compare with actual project count
SELECT
    a.name as account_name,
    uc.projects_count as usage_counter_says,
    COUNT(p.id) as actual_active_projects,
    uc.projects_count - COUNT(p.id) as difference
FROM accounts a
LEFT JOIN usage_counters uc ON a.id = uc.account_id
LEFT JOIN projects p ON a.id = p.account_id AND p.is_active = true
WHERE a.user_id = auth.uid()
GROUP BY a.id, a.name, uc.projects_count, uc.period_start
ORDER BY uc.period_start DESC;

-- Check for ALL periods to see if there are multiple entries
SELECT
    COUNT(*) as total_usage_counter_entries,
    SUM(projects_count) as total_recorded_projects,
    MAX(projects_count) as max_recorded_projects,
    MIN(period_start) as earliest_period,
    MAX(period_start) as latest_period
FROM usage_counters uc
JOIN accounts a ON uc.account_id = a.id
WHERE a.user_id = auth.uid();