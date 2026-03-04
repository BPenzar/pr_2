-- Lock down materialized views so they are not exposed via the Data APIs.
-- Note: PostgreSQL does not support RLS on materialized views, so we must rely on privileges.
-- Access should go through the SECURITY DEFINER RPCs introduced in
-- `018_secure_materialized_views_corrected.sql`.

REVOKE SELECT ON public.dashboard_summary FROM anon;
REVOKE SELECT ON public.dashboard_summary FROM authenticated;

REVOKE SELECT ON public.form_analytics FROM anon;
REVOKE SELECT ON public.form_analytics FROM authenticated;

REVOKE SELECT ON public.response_trends FROM anon;
REVOKE SELECT ON public.response_trends FROM authenticated;

