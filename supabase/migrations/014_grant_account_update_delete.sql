-- Ensure authenticated users can update or delete their own account when RLS policies allow it.

GRANT UPDATE, DELETE ON accounts TO authenticated;
