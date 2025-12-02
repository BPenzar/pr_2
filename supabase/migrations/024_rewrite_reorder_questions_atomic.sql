-- Rewrite reorder_questions to avoid unique constraint conflicts while swapping.

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

  -- Build parameter mapping once
  WITH params AS (
    SELECT
      unnest(question_ids) AS id,
      unnest(order_indexes) AS order_index
  ),
  -- First bump the selected questions away from current indexes to avoid unique collisions
  bumped AS (
    UPDATE public.questions q
    SET order_index = order_index + 1000000
    WHERE q.id IN (SELECT id FROM params)
      AND q.form_id = form_uuid
    RETURNING q.id
  )
  -- Then apply the desired ordering
  UPDATE public.questions q
  SET order_index = params.order_index
  FROM params
  WHERE q.id = params.id
    AND q.form_id = form_uuid;
END;
$$;
