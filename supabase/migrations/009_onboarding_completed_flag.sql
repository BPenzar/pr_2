-- Add onboarding completion flag to accounts for skip logic.

ALTER TABLE accounts
ADD COLUMN IF NOT EXISTS onboarding_completed BOOLEAN NOT NULL DEFAULT false;

-- Mark accounts with existing projects as completed.
UPDATE accounts
SET onboarding_completed = true
WHERE id IN (
  SELECT DISTINCT project.account_id
  FROM projects AS project
);
