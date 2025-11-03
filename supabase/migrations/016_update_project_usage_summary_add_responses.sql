-- Extend project usage summary to report response counts alongside forms and QR codes.
drop function if exists public.get_project_usage_summary(uuid);

create function public.get_project_usage_summary(account_uuid uuid)
returns table(
  project_id uuid,
  forms_count integer,
  responses_count integer,
  qr_codes_count integer
) as $$
  select
    p.id as project_id,
    count(distinct f.id) as forms_count,
    count(distinct r.id) as responses_count,
    count(q.id) as qr_codes_count
  from public.projects p
    left join public.forms f on f.project_id = p.id and coalesce(f.is_active, true)
    left join public.responses r on r.form_id = f.id
    left join public.qr_codes q on q.form_id = f.id
  where p.account_id = account_uuid
    and coalesce(p.is_active, true)
  group by p.id;
$$ language sql stable;
