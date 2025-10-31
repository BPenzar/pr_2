-- Adjust plan pricing to €19 / €48 and ensure features stay aligned across tiers.

UPDATE plans
SET price = CASE name
    WHEN 'Free' THEN 0
    WHEN 'Starter' THEN 1900
    WHEN 'Professional' THEN 4800
    ELSE price
  END,
  features = '["advanced_analytics", "qr_codes", "export_csv", "custom_branding"]',
  updated_at = NOW()
WHERE name IN ('Free', 'Starter', 'Professional');
