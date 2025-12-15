-- Local seed data (used by `supabase db reset`)
-- Keep idempotent so it can be re-run safely.

INSERT INTO plans (name, price, max_projects, max_forms_per_project, max_responses_per_form, features)
VALUES
  (
    'Free',
    0,
    -1,
    -1,
    -1,
    '["Basic dashboard", "QR code generation", "CSV export", "Email support", "Unlimited usage"]'
  ),
  (
    'Starter',
    999,
    5,
    10,
    500,
    '["Everything in Free", "Multiple projects", "Advanced analytics", "Email notifications", "Priority support"]'
  ),
  (
    'Professional',
    2999,
    25,
    50,
    5000,
    '["Everything in Starter", "Web widgets", "Custom branding", "Team collaboration", "API access", "Webhook integrations"]'
  ),
  (
    'Enterprise',
    9999,
    -1,
    -1,
    -1,
    '["Everything in Professional", "Unlimited everything", "Custom integrations", "Dedicated support", "SLA guarantee", "On-premise deployment"]'
  )
ON CONFLICT (name) DO UPDATE
SET
  price = EXCLUDED.price,
  max_projects = EXCLUDED.max_projects,
  max_forms_per_project = EXCLUDED.max_forms_per_project,
  max_responses_per_form = EXCLUDED.max_responses_per_form,
  features = EXCLUDED.features,
  is_active = true,
  updated_at = NOW();

