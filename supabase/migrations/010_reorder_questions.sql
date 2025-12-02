-- Ensure question reordering keeps unique (form_id, order_index) constraint
create or replace function public.reorder_questions(
  form_uuid uuid,
  question_ids uuid[],
  order_indexes integer[]
) returns void
language plpgsql
SET search_path = 'public'
as $$
begin
  if array_length(question_ids, 1) is distinct from array_length(order_indexes, 1) then
    raise exception 'question_ids and order_indexes must have the same length';
  end if;

  update public.questions q
  set order_index = reordered.order_index
  from (
    select
      unnest(question_ids) as id,
      unnest(order_indexes) as order_index
  ) as reordered
  where q.id = reordered.id and q.form_id = form_uuid;
end;
$$;
