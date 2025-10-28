-- Utility functions and triggers for BSP Feedback Tool

-- Function to generate short URL for QR codes
CREATE OR REPLACE FUNCTION generate_short_url()
RETURNS TEXT AS $$
DECLARE
  chars TEXT := 'ABCDEFGHJKMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789';
  short_url TEXT := '';
  i INTEGER;
BEGIN
  FOR i IN 1..8 LOOP
    short_url := short_url || substr(chars, floor(random() * length(chars) + 1)::INTEGER, 1);
  END LOOP;

  -- Check if the short URL already exists
  WHILE EXISTS (SELECT 1 FROM qr_codes WHERE short_url = short_url) LOOP
    short_url := '';
    FOR i IN 1..8 LOOP
      short_url := short_url || substr(chars, floor(random() * length(chars) + 1)::INTEGER, 1);
    END LOOP;
  END LOOP;

  RETURN short_url;
END;
$$ LANGUAGE plpgsql;

-- Function to create account automatically when user signs up
CREATE OR REPLACE FUNCTION create_user_account()
RETURNS TRIGGER AS $$
DECLARE
  free_plan_id UUID;
BEGIN
  -- Get the Free plan ID
  SELECT id INTO free_plan_id FROM plans WHERE name = 'Free' LIMIT 1;

  -- Create account for new user
  INSERT INTO accounts (user_id, name, plan_id)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
    free_plan_id
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create account when user signs up
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION create_user_account();

-- Function to check if user can create projects based on plan limits
CREATE OR REPLACE FUNCTION can_create_project(account_uuid UUID)
RETURNS BOOLEAN AS $$
DECLARE
  current_count INTEGER;
  max_allowed INTEGER;
BEGIN
  -- Get current project count
  SELECT COUNT(*) INTO current_count
  FROM projects
  WHERE account_id = account_uuid AND is_active = true;

  -- Get max allowed from plan
  SELECT p.max_projects INTO max_allowed
  FROM accounts a
  JOIN plans p ON a.plan_id = p.id
  WHERE a.id = account_uuid;

  -- Return true if unlimited (-1) or under limit
  RETURN max_allowed = -1 OR current_count < max_allowed;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if user can create forms based on plan limits
CREATE OR REPLACE FUNCTION can_create_form(project_uuid UUID)
RETURNS BOOLEAN AS $$
DECLARE
  current_count INTEGER;
  max_allowed INTEGER;
  account_uuid UUID;
BEGIN
  -- Get account_id for the project
  SELECT account_id INTO account_uuid
  FROM projects
  WHERE id = project_uuid;

  -- Get current form count for this project
  SELECT COUNT(*) INTO current_count
  FROM forms
  WHERE project_id = project_uuid AND is_active = true;

  -- Get max allowed from plan
  SELECT p.max_forms_per_project INTO max_allowed
  FROM accounts a
  JOIN plans p ON a.plan_id = p.id
  WHERE a.id = account_uuid;

  -- Return true if unlimited (-1) or under limit
  RETURN max_allowed = -1 OR current_count < max_allowed;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if form can accept more responses based on plan limits
CREATE OR REPLACE FUNCTION can_accept_response(form_uuid UUID)
RETURNS BOOLEAN AS $$
DECLARE
  current_count INTEGER;
  max_allowed INTEGER;
  account_uuid UUID;
BEGIN
  -- Get account_id for the form
  SELECT p.account_id INTO account_uuid
  FROM forms f
  JOIN projects p ON f.project_id = p.id
  WHERE f.id = form_uuid;

  -- Get current response count for this form
  SELECT COUNT(*) INTO current_count
  FROM responses
  WHERE form_id = form_uuid;

  -- Get max allowed from plan
  SELECT pl.max_responses_per_form INTO max_allowed
  FROM accounts a
  JOIN plans pl ON a.plan_id = pl.id
  WHERE a.id = account_uuid;

  -- Return true if unlimited (-1) or under limit
  RETURN max_allowed = -1 OR current_count < max_allowed;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to update usage counters
CREATE OR REPLACE FUNCTION update_usage_counters()
RETURNS TRIGGER AS $$
DECLARE
  account_uuid UUID;
  current_period_start DATE;
  current_period_end DATE;
BEGIN
  -- Determine which table triggered this
  IF TG_TABLE_NAME = 'projects' THEN
    account_uuid := NEW.account_id;
  ELSIF TG_TABLE_NAME = 'forms' THEN
    SELECT account_id INTO account_uuid
    FROM projects WHERE id = NEW.project_id;
  ELSIF TG_TABLE_NAME = 'responses' THEN
    SELECT p.account_id INTO account_uuid
    FROM forms f
    JOIN projects p ON f.project_id = p.id
    WHERE f.id = NEW.form_id;
  ELSIF TG_TABLE_NAME = 'qr_codes' THEN
    SELECT p.account_id INTO account_uuid
    FROM forms f
    JOIN projects p ON f.project_id = p.id
    WHERE f.id = NEW.form_id;
  END IF;

  -- Calculate current month period
  current_period_start := DATE_TRUNC('month', CURRENT_DATE)::DATE;
  current_period_end := (DATE_TRUNC('month', CURRENT_DATE) + INTERVAL '1 month' - INTERVAL '1 day')::DATE;

  -- Insert or update usage counter
  INSERT INTO usage_counters (
    account_id,
    period_start,
    period_end,
    projects_count,
    forms_count,
    responses_count,
    qr_scans_count
  )
  VALUES (
    account_uuid,
    current_period_start,
    current_period_end,
    CASE WHEN TG_TABLE_NAME = 'projects' THEN 1 ELSE 0 END,
    CASE WHEN TG_TABLE_NAME = 'forms' THEN 1 ELSE 0 END,
    CASE WHEN TG_TABLE_NAME = 'responses' THEN 1 ELSE 0 END,
    0
  )
  ON CONFLICT (account_id, period_start)
  DO UPDATE SET
    projects_count = usage_counters.projects_count + CASE WHEN TG_TABLE_NAME = 'projects' THEN 1 ELSE 0 END,
    forms_count = usage_counters.forms_count + CASE WHEN TG_TABLE_NAME = 'forms' THEN 1 ELSE 0 END,
    responses_count = usage_counters.responses_count + CASE WHEN TG_TABLE_NAME = 'responses' THEN 1 ELSE 0 END,
    updated_at = NOW();

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Triggers for usage tracking
CREATE TRIGGER track_project_usage
  AFTER INSERT ON projects
  FOR EACH ROW EXECUTE FUNCTION update_usage_counters();

CREATE TRIGGER track_form_usage
  AFTER INSERT ON forms
  FOR EACH ROW EXECUTE FUNCTION update_usage_counters();

CREATE TRIGGER track_response_usage
  AFTER INSERT ON responses
  FOR EACH ROW EXECUTE FUNCTION update_usage_counters();

-- Function to log audit events
CREATE OR REPLACE FUNCTION log_audit_event(
  p_account_id UUID,
  p_user_id UUID,
  p_action VARCHAR(50),
  p_resource_type VARCHAR(50),
  p_resource_id UUID DEFAULT NULL,
  p_details JSONB DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  audit_id UUID;
BEGIN
  INSERT INTO audit_logs (
    account_id,
    user_id,
    action,
    resource_type,
    resource_id,
    details
  )
  VALUES (
    p_account_id,
    p_user_id,
    p_action,
    p_resource_type,
    p_resource_id,
    p_details
  )
  RETURNING id INTO audit_id;

  RETURN audit_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to increment QR scan count
CREATE OR REPLACE FUNCTION increment_qr_scan(qr_code_uuid UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE qr_codes
  SET scan_count = scan_count + 1
  WHERE id = qr_code_uuid;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;