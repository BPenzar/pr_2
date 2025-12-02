-- Ensure authenticated users can call reorder_questions.

GRANT EXECUTE ON FUNCTION public.reorder_questions(
  uuid,
  uuid[],
  integer[]
) TO authenticated;
