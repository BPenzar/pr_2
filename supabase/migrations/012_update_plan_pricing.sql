-- Align plan pricing, limits, and shared features with the updated subscription lineup.

UPDATE plans
SET
  price = CASE name
    WHEN 'Free' THEN 0
    WHEN 'Starter' THEN 1900
    WHEN 'Professional' THEN 4800
    ELSE price
  END,
  max_projects = CASE name
    WHEN 'Free' THEN 1
    WHEN 'Starter' THEN 10
    WHEN 'Professional' THEN 25
    ELSE max_projects
  END,
  max_forms_per_project = CASE name
    WHEN 'Free' THEN 3
    WHEN 'Starter' THEN 20
    WHEN 'Professional' THEN 50
    ELSE max_forms_per_project
  END,
  max_responses_per_form = CASE name
    WHEN 'Free' THEN 50
    WHEN 'Starter' THEN 1000
    WHEN 'Professional' THEN 5000
    ELSE max_responses_per_form
  END,
  features = '["advanced_analytics", "qr_codes", "export_csv", "custom_branding"]',
  updated_at = NOW()
WHERE name IN ('Free', 'Starter', 'Professional');

-- Deactivate legacy plans that should no longer appear.
UPDATE plans
SET is_active = false,
    updated_at = NOW()
WHERE name NOT IN ('Free', 'Starter', 'Professional');
