-- Allow authenticated users to access public (active) forms and submit responses.

CREATE POLICY "Authenticated can view active forms" ON forms
  FOR SELECT TO authenticated USING (is_active = true);

CREATE POLICY "Authenticated can view questions for active forms" ON questions
  FOR SELECT TO authenticated USING (
    form_id IN (
      SELECT id FROM forms
      WHERE is_active = true
    )
  );

CREATE POLICY "Authenticated can view QR codes for active forms" ON qr_codes
  FOR SELECT TO authenticated USING (
    form_id IN (
      SELECT id FROM forms
      WHERE is_active = true
    )
  );

CREATE POLICY "Authenticated can submit responses to active forms" ON responses
  FOR INSERT TO authenticated WITH CHECK (
    form_id IN (
      SELECT f.id FROM forms f
      WHERE f.is_active = true
    )
  );

CREATE POLICY "Authenticated can submit response items for active forms" ON response_items
  FOR INSERT TO authenticated WITH CHECK (
    response_id IN (
      SELECT r.id FROM responses r
      JOIN forms f ON r.form_id = f.id
      WHERE f.is_active = true
    )
  );
