-- Ensure log_audit_event runs with a fixed search_path for security.

ALTER FUNCTION public.log_audit_event(
  uuid,
  uuid,
  character varying,
  character varying,
  uuid,
  jsonb
) SET search_path = public;
