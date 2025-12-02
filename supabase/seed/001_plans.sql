-- Seed data for plans
-- Based on PRD requirements: Free plan with limits, ready for paid plans

INSERT INTO plans (name, price, max_projects, max_forms_per_project, max_responses_per_form, features) VALUES
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
    999, -- $9.99/month
    5,
    10,
    500,
    '["Everything in Free", "Multiple projects", "Advanced analytics", "Email notifications", "Priority support"]'
  ),
  (
    'Professional',
    2999, -- $29.99/month
    25,
    50,
    5000,
    '["Everything in Starter", "Web widgets", "Custom branding", "Team collaboration", "API access", "Webhook integrations"]'
  ),
  (
    'Enterprise',
    9999, -- $99.99/month
    -1, -- Unlimited
    -1, -- Unlimited
    -1, -- Unlimited
    '["Everything in Professional", "Unlimited everything", "Custom integrations", "Dedicated support", "SLA guarantee", "On-premise deployment"]'
  );

-- Set Free plan as default for new accounts
-- This will be used in the account creation trigger
