-- Allow service_role (used by Supabase auth triggers) to insert accounts.

DROP POLICY IF EXISTS "accounts_insert_service" ON accounts;

CREATE POLICY "accounts_insert_service" ON accounts
  FOR INSERT TO service_role WITH CHECK (true);
