-- Align migrations with live schema indexes and function overloads.

-- Missing indexes present in live schema.
CREATE INDEX IF NOT EXISTS idx_accounts_plan_id ON public.accounts (plan_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON public.audit_logs (user_id);
CREATE INDEX IF NOT EXISTS idx_responses_qr_code_id ON public.responses (qr_code_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_plan_id ON public.subscriptions (plan_id);

-- Text-typed overload present in live schema.
CREATE OR REPLACE FUNCTION public.log_audit_event(
  p_account_id uuid,
  p_user_id uuid,
  p_action text,
  p_resource_type text,
  p_resource_id uuid DEFAULT NULL::uuid,
  p_details jsonb DEFAULT NULL::jsonb
) RETURNS uuid
LANGUAGE plpgsql SECURITY DEFINER
SET search_path TO 'public', 'pg_catalog'
AS $$
DECLARE
  audit_id uuid;
BEGIN
  INSERT INTO public.audit_logs (
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
$$;
