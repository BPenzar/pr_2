-- Make (form_id, order_index) uniqueness deferrable to allow safe reordering swaps.

DO $$
DECLARE
  constraint_name text;
BEGIN
  SELECT conname INTO constraint_name
  FROM pg_constraint
  WHERE conrelid = 'public.questions'::regclass
    AND contype = 'u'
    AND array_length(conkey, 1) = 2
    AND conkey @> ARRAY[
      (SELECT attnum FROM pg_attribute WHERE attrelid = 'public.questions'::regclass AND attname = 'form_id'),
      (SELECT attnum FROM pg_attribute WHERE attrelid = 'public.questions'::regclass AND attname = 'order_index')
    ]::smallint[];

  IF constraint_name IS NOT NULL THEN
    EXECUTE format('ALTER TABLE public.questions DROP CONSTRAINT %I', constraint_name);
  END IF;
END
$$;

ALTER TABLE public.questions
  ADD CONSTRAINT questions_form_id_order_index_key
  UNIQUE (form_id, order_index)
  DEFERRABLE INITIALLY DEFERRED;
