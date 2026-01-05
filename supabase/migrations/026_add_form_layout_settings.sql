ALTER TABLE forms
  ADD COLUMN submission_layout TEXT NOT NULL DEFAULT 'single',
  ADD COLUMN questions_per_step INTEGER NOT NULL DEFAULT 1;

ALTER TABLE forms
  ADD CONSTRAINT forms_questions_per_step_positive CHECK (questions_per_step >= 1);
