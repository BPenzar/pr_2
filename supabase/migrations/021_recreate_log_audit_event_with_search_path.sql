-- Recreate log_audit_event with an explicit search_path to satisfy linter.

DROP FUNCTION IF EXISTS public.log_audit_event(
  uuid,
  uuid,
  character varying,
  character varying,
  uuid,
  jsonb
);

CREATE OR REPLACE FUNCTION public.log_audit_event(
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
$$ LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public;
