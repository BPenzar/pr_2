-- Seed default subscription plans to support onboarding trigger logic.
-- Ensures the "Free" plan exists so create_user_account can attach it.

INSERT INTO plans (name, price, max_projects, max_forms_per_project, max_responses_per_form, features, is_active)
VALUES
  ('Free', 0, 1, 3, 50, '["advanced_analytics", "qr_codes", "export_csv", "custom_branding"]', true),
  ('Starter', 1900, 10, 20, 1000, '["advanced_analytics", "qr_codes", "export_csv", "custom_branding"]', true),
  ('Professional', 4800, 25, 50, 5000, '["advanced_analytics", "qr_codes", "export_csv", "custom_branding"]', true)
ON CONFLICT (name) DO UPDATE
SET
  price = EXCLUDED.price,
  max_projects = EXCLUDED.max_projects,
  max_forms_per_project = EXCLUDED.max_forms_per_project,
  max_responses_per_form = EXCLUDED.max_responses_per_form,
  features = EXCLUDED.features,
  is_active = EXCLUDED.is_active;
