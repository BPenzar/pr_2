-- Row Level Security Policies for BSP Feedback Tool
-- Ensures users can only access data belonging to their account

-- Enable RLS on all tables
ALTER TABLE accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE forms ENABLE ROW LEVEL SECURITY;
ALTER TABLE questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE qr_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE response_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE usage_counters ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Plans table - read-only for authenticated users
ALTER TABLE plans ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Plans are readable by authenticated users" ON plans
  FOR SELECT TO authenticated USING (true);

-- Helper function to get user's account_id
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

-- Accounts policies
CREATE POLICY "Users can read their own account" ON accounts
  FOR SELECT TO authenticated USING (user_id = auth.uid());

CREATE POLICY "Users can create their own account" ON accounts
  FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own account" ON accounts
  FOR UPDATE TO authenticated USING (user_id = auth.uid());

-- Projects policies
CREATE POLICY "Users can read their account's projects" ON projects
  FOR SELECT TO authenticated USING (account_id = get_user_account_id());

CREATE POLICY "Users can create projects in their account" ON projects
  FOR INSERT TO authenticated WITH CHECK (account_id = get_user_account_id());

CREATE POLICY "Users can update their account's projects" ON projects
  FOR UPDATE TO authenticated USING (account_id = get_user_account_id());

CREATE POLICY "Users can delete their account's projects" ON projects
  FOR DELETE TO authenticated USING (account_id = get_user_account_id());

-- Forms policies
CREATE POLICY "Users can read forms in their account's projects" ON forms
  FOR SELECT TO authenticated USING (
    project_id IN (
      SELECT id FROM projects WHERE account_id = get_user_account_id()
    )
  );

CREATE POLICY "Users can create forms in their account's projects" ON forms
  FOR INSERT TO authenticated WITH CHECK (
    project_id IN (
      SELECT id FROM projects WHERE account_id = get_user_account_id()
    )
  );

CREATE POLICY "Users can update forms in their account's projects" ON forms
  FOR UPDATE TO authenticated USING (
    project_id IN (
      SELECT id FROM projects WHERE account_id = get_user_account_id()
    )
  );

CREATE POLICY "Users can delete forms in their account's projects" ON forms
  FOR DELETE TO authenticated USING (
    project_id IN (
      SELECT id FROM projects WHERE account_id = get_user_account_id()
    )
  );

-- Questions policies
CREATE POLICY "Users can read questions in their account's forms" ON questions
  FOR SELECT TO authenticated USING (
    form_id IN (
      SELECT f.id FROM forms f
      JOIN projects p ON f.project_id = p.id
      WHERE p.account_id = get_user_account_id()
    )
  );

CREATE POLICY "Users can create questions in their account's forms" ON questions
  FOR INSERT TO authenticated WITH CHECK (
    form_id IN (
      SELECT f.id FROM forms f
      JOIN projects p ON f.project_id = p.id
      WHERE p.account_id = get_user_account_id()
    )
  );

CREATE POLICY "Users can update questions in their account's forms" ON questions
  FOR UPDATE TO authenticated USING (
    form_id IN (
      SELECT f.id FROM forms f
      JOIN projects p ON f.project_id = p.id
      WHERE p.account_id = get_user_account_id()
    )
  );

CREATE POLICY "Users can delete questions in their account's forms" ON questions
  FOR DELETE TO authenticated USING (
    form_id IN (
      SELECT f.id FROM forms f
      JOIN projects p ON f.project_id = p.id
      WHERE p.account_id = get_user_account_id()
    )
  );

-- QR Codes policies
CREATE POLICY "Users can read QR codes for their account's forms" ON qr_codes
  FOR SELECT TO authenticated USING (
    form_id IN (
      SELECT f.id FROM forms f
      JOIN projects p ON f.project_id = p.id
      WHERE p.account_id = get_user_account_id()
    )
  );

CREATE POLICY "Users can create QR codes for their account's forms" ON qr_codes
  FOR INSERT TO authenticated WITH CHECK (
    form_id IN (
      SELECT f.id FROM forms f
      JOIN projects p ON f.project_id = p.id
      WHERE p.account_id = get_user_account_id()
    )
  );

CREATE POLICY "Users can update QR codes for their account's forms" ON qr_codes
  FOR UPDATE TO authenticated USING (
    form_id IN (
      SELECT f.id FROM forms f
      JOIN projects p ON f.project_id = p.id
      WHERE p.account_id = get_user_account_id()
    )
  );

CREATE POLICY "Users can delete QR codes for their account's forms" ON qr_codes
  FOR DELETE TO authenticated USING (
    form_id IN (
      SELECT f.id FROM forms f
      JOIN projects p ON f.project_id = p.id
      WHERE p.account_id = get_user_account_id()
    )
  );

-- Responses policies
CREATE POLICY "Users can read responses to their account's forms" ON responses
  FOR SELECT TO authenticated USING (
    form_id IN (
      SELECT f.id FROM forms f
      JOIN projects p ON f.project_id = p.id
      WHERE p.account_id = get_user_account_id()
    )
  );

-- Allow anonymous users to submit responses (public forms)
CREATE POLICY "Anyone can submit responses to active forms" ON responses
  FOR INSERT TO anon WITH CHECK (
    form_id IN (
      SELECT f.id FROM forms f
      WHERE f.is_active = true
    )
  );

-- Response items policies
CREATE POLICY "Users can read response items for their account's forms" ON response_items
  FOR SELECT TO authenticated USING (
    response_id IN (
      SELECT r.id FROM responses r
      JOIN forms f ON r.form_id = f.id
      JOIN projects p ON f.project_id = p.id
      WHERE p.account_id = get_user_account_id()
    )
  );

-- Allow anonymous users to submit response items (public forms)
CREATE POLICY "Anyone can submit response items for valid responses" ON response_items
  FOR INSERT TO anon WITH CHECK (
    response_id IN (
      SELECT r.id FROM responses r
      JOIN forms f ON r.form_id = f.id
      WHERE f.is_active = true
    )
  );

-- Usage counters policies
CREATE POLICY "Users can read their account's usage counters" ON usage_counters
  FOR SELECT TO authenticated USING (account_id = get_user_account_id());

CREATE POLICY "Users can create usage counters for their account" ON usage_counters
  FOR INSERT TO authenticated WITH CHECK (account_id = get_user_account_id());

CREATE POLICY "Users can update their account's usage counters" ON usage_counters
  FOR UPDATE TO authenticated USING (account_id = get_user_account_id());

-- Subscriptions policies
CREATE POLICY "Users can read their account's subscriptions" ON subscriptions
  FOR SELECT TO authenticated USING (account_id = get_user_account_id());

CREATE POLICY "Users can create subscriptions for their account" ON subscriptions
  FOR INSERT TO authenticated WITH CHECK (account_id = get_user_account_id());

CREATE POLICY "Users can update their account's subscriptions" ON subscriptions
  FOR UPDATE TO authenticated USING (account_id = get_user_account_id());

-- Audit logs policies
CREATE POLICY "Users can read their account's audit logs" ON audit_logs
  FOR SELECT TO authenticated USING (account_id = get_user_account_id());

CREATE POLICY "Service can insert audit logs" ON audit_logs
  FOR INSERT TO service_role WITH CHECK (true);