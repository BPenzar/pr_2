-- Recreate reorder_questions as SECURITY DEFINER so RLS doesn't block reordering.

DROP FUNCTION IF EXISTS public.reorder_questions(uuid, uuid[], integer[]);

CREATE OR REPLACE FUNCTION public.reorder_questions(
  form_uuid uuid,
  question_ids uuid[],
  order_indexes integer[]
) RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF array_length(question_ids, 1) IS DISTINCT FROM array_length(order_indexes, 1) THEN
    RAISE EXCEPTION 'question_ids and order_indexes must have the same length';
  END IF;

  UPDATE public.questions q
  SET order_index = reordered.order_index
  FROM (
    SELECT
      unnest(question_ids) AS id,
      unnest(order_indexes) AS order_index
  ) AS reordered
  WHERE q.id = reordered.id
    AND q.form_id = form_uuid;
END;
$$;
