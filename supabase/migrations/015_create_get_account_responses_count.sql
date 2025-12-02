-- Ensure response counting RPC exists for plan usage queries.

create or replace function public.get_account_responses_count(
  account_uuid uuid,
  start_date   timestamptz default null
)
returns integer
language sql
stable
SET search_path = 'public'
as $$
  select coalesce(count(*)::integer, 0)
  from public.responses r
  join public.forms f on f.id = r.form_id
  join public.projects p on p.id = f.project_id
  where p.account_id = account_uuid
    and (start_date is null or r.submitted_at >= start_date);
$$;

grant execute on function public.get_account_responses_count(uuid, timestamptz) to authenticated;
