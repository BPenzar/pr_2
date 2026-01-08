-- Align authenticated SELECT policies with live schema behavior.

DROP POLICY IF EXISTS "Users can read forms in their account's projects" ON public.forms;
DROP POLICY IF EXISTS "Authenticated can view active forms" ON public.forms;
DROP POLICY IF EXISTS "Authenticated can view forms" ON public.forms;

CREATE POLICY "Authenticated can view forms" ON public.forms
  FOR SELECT TO authenticated
  USING (
    (is_active = true)
    OR (project_id IN (
      SELECT projects.id
      FROM public.projects
      WHERE projects.account_id = public.get_user_account_id()
    ))
  );

DROP POLICY IF EXISTS "Users can read questions in their account's forms" ON public.questions;
DROP POLICY IF EXISTS "Authenticated can view questions for active forms" ON public.questions;
DROP POLICY IF EXISTS "Authenticated can view questions" ON public.questions;

CREATE POLICY "Authenticated can view questions" ON public.questions
  FOR SELECT TO authenticated
  USING (
    form_id IN (
      SELECT forms.id
      FROM public.forms
      WHERE (forms.is_active = true)
         OR (forms.project_id IN (
              SELECT projects.id
              FROM public.projects
              WHERE projects.account_id = public.get_user_account_id()
            ))
    )
  );

DROP POLICY IF EXISTS "Users can read QR codes for their account's forms" ON public.qr_codes;
DROP POLICY IF EXISTS "Authenticated can view QR codes for active forms" ON public.qr_codes;
DROP POLICY IF EXISTS "Authenticated can view qr codes" ON public.qr_codes;

CREATE POLICY "Authenticated can view qr codes" ON public.qr_codes
  FOR SELECT TO authenticated
  USING (
    form_id IN (
      SELECT forms.id
      FROM public.forms
      WHERE (forms.is_active = true)
         OR (forms.project_id IN (
              SELECT projects.id
              FROM public.projects
              WHERE projects.account_id = public.get_user_account_id()
            ))
    )
  );

DROP POLICY IF EXISTS "Service can create accounts" ON public.accounts;
