--
-- PostgreSQL database dump
--

\restrict F9x0QzeEs1LrmzGM1YaAntMVdDUKEJP4JdNExxbs0Wxw8lcBxsMLHSTMpdiK0Qh

-- Dumped from database version 17.6
-- Dumped by pg_dump version 17.7 (Ubuntu 17.7-3.pgdg24.04+1)

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: public; Type: SCHEMA; Schema: -; Owner: -
--

CREATE SCHEMA public;


--
-- Name: question_type; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.question_type AS ENUM (
    'text',
    'textarea',
    'rating',
    'choice',
    'multiselect'
);


--
-- Name: can_accept_response(uuid); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.can_accept_response(form_uuid uuid) RETURNS boolean
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
DECLARE
  current_count INTEGER;
  max_allowed INTEGER;
  account_uuid UUID;
BEGIN
  -- Get account_id for the form
  SELECT p.account_id INTO account_uuid
  FROM forms f
  JOIN projects p ON f.project_id = p.id
  WHERE f.id = form_uuid;

  -- Get current response count for this form
  SELECT COUNT(*) INTO current_count
  FROM responses
  WHERE form_id = form_uuid;

  -- Get max allowed from plan
  SELECT pl.max_responses_per_form INTO max_allowed
  FROM accounts a
  JOIN plans pl ON a.plan_id = pl.id
  WHERE a.id = account_uuid;

  -- Return true if unlimited (-1) or under limit
  RETURN max_allowed = -1 OR current_count < max_allowed;
END;
$$;


--
-- Name: can_create_form(uuid, uuid); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.can_create_form(project_uuid uuid, account_uuid uuid DEFAULT NULL::uuid) RETURNS boolean
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
DECLARE
  current_count INTEGER;
  max_allowed INTEGER;
  project_account UUID;
BEGIN
  -- Get account_id for the project
  SELECT account_id INTO project_account
  FROM projects
  WHERE id = project_uuid;

  IF project_account IS NULL THEN
    RAISE EXCEPTION 'Project % does not exist', project_uuid
      USING ERRCODE = 'P0002';
  END IF;

  IF account_uuid IS NOT NULL AND project_account <> account_uuid THEN
    RAISE EXCEPTION 'Project % does not belong to account %', project_uuid, account_uuid
      USING ERRCODE = '42501';
  END IF;

  -- Get current form count for this project
  SELECT COUNT(*) INTO current_count
  FROM forms
  WHERE project_id = project_uuid AND is_active = true;

  -- Get max allowed from plan
  SELECT p.max_forms_per_project INTO max_allowed
  FROM accounts a
  JOIN plans p ON a.plan_id = p.id
  WHERE a.id = project_account;

  IF max_allowed IS NULL THEN
    RAISE EXCEPTION 'Plan limits missing for account %', project_account
      USING ERRCODE = 'P0002';
  END IF;

  -- Return true if unlimited (-1) or under limit
  RETURN max_allowed = -1 OR current_count < max_allowed;
END;
$$;


--
-- Name: can_create_project(uuid); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.can_create_project(account_uuid uuid) RETURNS boolean
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
DECLARE
  current_count INTEGER;
  max_allowed INTEGER;
BEGIN
  -- Get current project count
  SELECT COUNT(*) INTO current_count
  FROM projects
  WHERE account_id = account_uuid AND is_active = true;

  -- Get max allowed from plan
  SELECT p.max_projects INTO max_allowed
  FROM accounts a
  JOIN plans p ON a.plan_id = p.id
  WHERE a.id = account_uuid;

  IF max_allowed IS NULL THEN
    RAISE EXCEPTION 'Plan limits missing for account %', account_uuid
      USING ERRCODE = 'P0002';
  END IF;

  -- Return true if unlimited (-1) or under limit
  RETURN max_allowed = -1 OR current_count < max_allowed;
END;
$$;


--
-- Name: create_user_account(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.create_user_account() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
DECLARE
    free_plan_id UUID;
    new_account_id UUID;
    current_period_start DATE;
    current_period_end DATE;
    user_name TEXT;
BEGIN
    SELECT id
      INTO free_plan_id
      FROM plans
     WHERE name = 'Free'
     LIMIT 1;

    IF free_plan_id IS NULL THEN
        INSERT INTO plans (
            name,
            price,
            max_projects,
            max_forms_per_project,
            max_responses_per_form,
            features,
            is_active
        )
        VALUES (
            'Free',
            0,
            -1,
            -1,
            -1,
            '["basic_analytics", "qr_codes"]',
            true
        )
        ON CONFLICT (name) DO UPDATE
            SET price = EXCLUDED.price,
                max_projects = EXCLUDED.max_projects,
                max_forms_per_project = EXCLUDED.max_forms_per_project,
                max_responses_per_form = EXCLUDED.max_responses_per_form,
                features = EXCLUDED.features,
                is_active = true,
                updated_at = NOW()
        RETURNING id INTO free_plan_id;
    ELSE
        UPDATE plans
        SET price = 0,
            max_projects = -1,
            max_forms_per_project = -1,
            max_responses_per_form = -1,
            is_active = true,
            updated_at = NOW()
        WHERE id = free_plan_id;
    END IF;

    user_name := COALESCE(
        NEW.raw_user_meta_data->>'full_name',
        NEW.raw_user_meta_data->>'name',
        NEW.email,
        'User'
    );

    INSERT INTO accounts (user_id, name, plan_id)
    VALUES (NEW.id, user_name, free_plan_id)
    RETURNING id INTO new_account_id;

    current_period_start := DATE_TRUNC('month', CURRENT_DATE);
    current_period_end := (DATE_TRUNC('month', CURRENT_DATE) + INTERVAL '1 month - 1 day')::DATE;

    INSERT INTO usage_counters (
        account_id,
        period_start,
        period_end,
        projects_count,
        forms_count,
        responses_count,
        qr_scans_count
    ) VALUES (
        new_account_id,
        current_period_start,
        current_period_end,
        0, 0, 0, 0
    );

    RETURN NEW;

EXCEPTION
    WHEN OTHERS THEN
        RETURN NEW;
END;
$$;


--
-- Name: generate_short_url(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.generate_short_url() RETURNS text
    LANGUAGE plpgsql
    SET search_path TO 'public'
    AS $$
DECLARE
  chars TEXT := 'ABCDEFGHJKMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789';
  short_url TEXT := '';
  i INTEGER;
BEGIN
  FOR i IN 1..8 LOOP
    short_url := short_url || substr(chars, floor(random() * length(chars) + 1)::INTEGER, 1);
  END LOOP;

  -- Check if the short URL already exists
  WHILE EXISTS (SELECT 1 FROM qr_codes WHERE qr_codes.short_url = short_url) LOOP
    short_url := '';
    FOR i IN 1..8 LOOP
      short_url := short_url || substr(chars, floor(random() * length(chars) + 1)::INTEGER, 1);
    END LOOP;
  END LOOP;

  RETURN short_url;
END;
$$;


--
-- Name: get_account_responses_count(uuid, timestamp with time zone); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.get_account_responses_count(account_uuid uuid, start_date timestamp with time zone DEFAULT NULL::timestamp with time zone) RETURNS integer
    LANGUAGE sql STABLE
    SET search_path TO 'public'
    AS $$
  select coalesce(count(*)::integer, 0)
  from public.responses r
  join public.forms f on f.id = r.form_id
  join public.projects p on p.id = f.project_id
  where p.account_id = account_uuid
    and (start_date is null or r.submitted_at >= start_date);
$$;


--
-- Name: get_project_usage_summary(uuid); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.get_project_usage_summary(account_uuid uuid) RETURNS TABLE(project_id uuid, forms_count integer, responses_count integer, qr_codes_count integer)
    LANGUAGE sql STABLE
    SET search_path TO 'public'
    AS $$
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
$$;


--
-- Name: get_user_account_id(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.get_user_account_id() RETURNS uuid
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
BEGIN
  RETURN (
    SELECT id FROM accounts
    WHERE user_id = auth.uid()
    LIMIT 1
  );
END;
$$;


SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: forms; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.forms (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    project_id uuid NOT NULL,
    name character varying(100) NOT NULL,
    description text,
    is_active boolean DEFAULT true NOT NULL,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    submission_layout text DEFAULT 'single'::text NOT NULL,
    questions_per_step integer DEFAULT 1 NOT NULL,
    CONSTRAINT forms_questions_per_step_positive CHECK ((questions_per_step >= 1))
);


--
-- Name: projects; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.projects (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    account_id uuid NOT NULL,
    name character varying(100) NOT NULL,
    description text,
    is_active boolean DEFAULT true NOT NULL,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


--
-- Name: qr_codes; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.qr_codes (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    form_id uuid NOT NULL,
    short_url character varying(20) NOT NULL,
    full_url text NOT NULL,
    location_name character varying(100),
    scan_count integer DEFAULT 0 NOT NULL,
    created_at timestamp with time zone DEFAULT now()
);


--
-- Name: responses; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.responses (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    form_id uuid NOT NULL,
    qr_code_id uuid,
    ip_hash character varying(64),
    location_name character varying(100),
    user_agent_hash character varying(64),
    submitted_at timestamp with time zone DEFAULT now()
);


--
-- Name: dashboard_summary; Type: MATERIALIZED VIEW; Schema: public; Owner: -
--

CREATE MATERIALIZED VIEW public.dashboard_summary AS
 SELECT p.account_id,
    p.id AS project_id,
    p.name AS project_name,
    count(DISTINCT f.id) AS forms_count,
    count(DISTINCT r.id) AS total_responses,
    count(DISTINCT r.id) FILTER (WHERE (r.submitted_at >= (CURRENT_DATE - '7 days'::interval))) AS responses_last_7_days,
    count(DISTINCT r.id) FILTER (WHERE (r.submitted_at >= (CURRENT_DATE - '30 days'::interval))) AS responses_last_30_days,
    count(DISTINCT qr.id) AS qr_codes_count,
    COALESCE(sum(qr.scan_count), (0)::bigint) AS total_scans,
    min(r.submitted_at) AS first_response_at,
    max(r.submitted_at) AS latest_response_at
   FROM (((public.projects p
     LEFT JOIN public.forms f ON (((p.id = f.project_id) AND (f.is_active = true))))
     LEFT JOIN public.qr_codes qr ON ((f.id = qr.form_id)))
     LEFT JOIN public.responses r ON ((f.id = r.form_id)))
  WHERE (p.is_active = true)
  GROUP BY p.account_id, p.id, p.name
  WITH NO DATA;


--
-- Name: get_user_dashboard_summary(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.get_user_dashboard_summary() RETURNS SETOF public.dashboard_summary
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
BEGIN
  RETURN QUERY
  SELECT * FROM dashboard_summary
  WHERE account_id = get_user_account_id();
END;
$$;


--
-- Name: form_analytics; Type: MATERIALIZED VIEW; Schema: public; Owner: -
--

CREATE MATERIALIZED VIEW public.form_analytics AS
 SELECT f.id AS form_id,
    f.name AS form_name,
    p.account_id,
    count(DISTINCT r.id) AS total_responses,
    count(DISTINCT r.id) FILTER (WHERE (r.submitted_at >= (CURRENT_DATE - '7 days'::interval))) AS responses_last_7_days,
    count(DISTINCT r.id) FILTER (WHERE (r.submitted_at >= (CURRENT_DATE - '30 days'::interval))) AS responses_last_30_days,
    count(DISTINCT qr.id) AS qr_codes_count,
    COALESCE(sum(qr.scan_count), (0)::bigint) AS total_scans,
    min(r.submitted_at) AS first_response_at,
    max(r.submitted_at) AS latest_response_at,
        CASE
            WHEN ((count(DISTINCT qr.id) > 0) AND (sum(qr.scan_count) > 0)) THEN round((((count(DISTINCT r.id))::numeric / (sum(qr.scan_count))::numeric) * (100)::numeric), 2)
            ELSE (0)::numeric
        END AS conversion_rate
   FROM (((public.forms f
     JOIN public.projects p ON ((f.project_id = p.id)))
     LEFT JOIN public.qr_codes qr ON ((f.id = qr.form_id)))
     LEFT JOIN public.responses r ON ((f.id = r.form_id)))
  WHERE ((f.is_active = true) AND (p.is_active = true))
  GROUP BY f.id, f.name, p.account_id
  WITH NO DATA;


--
-- Name: get_user_form_analytics(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.get_user_form_analytics() RETURNS SETOF public.form_analytics
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
BEGIN
  RETURN QUERY
  SELECT * FROM form_analytics
  WHERE account_id = get_user_account_id();
END;
$$;


--
-- Name: response_trends; Type: MATERIALIZED VIEW; Schema: public; Owner: -
--

CREATE MATERIALIZED VIEW public.response_trends AS
 SELECT p.account_id,
    f.id AS form_id,
    date(r.submitted_at) AS response_date,
    count(*) AS responses_count
   FROM ((public.responses r
     JOIN public.forms f ON ((r.form_id = f.id)))
     JOIN public.projects p ON ((f.project_id = p.id)))
  WHERE (r.submitted_at >= (CURRENT_DATE - '90 days'::interval))
  GROUP BY p.account_id, f.id, (date(r.submitted_at))
  ORDER BY (date(r.submitted_at)) DESC
  WITH NO DATA;


--
-- Name: get_user_response_trends(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.get_user_response_trends() RETURNS SETOF public.response_trends
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
BEGIN
  RETURN QUERY
  SELECT * FROM response_trends
  WHERE account_id = get_user_account_id();
END;
$$;


--
-- Name: increment_qr_scan(uuid); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.increment_qr_scan(qr_code_uuid uuid) RETURNS void
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
BEGIN
  UPDATE qr_codes
  SET scan_count = scan_count + 1
  WHERE id = qr_code_uuid;
END;
$$;


--
-- Name: log_audit_event(uuid, uuid, text, text, uuid, jsonb); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.log_audit_event(p_account_id uuid, p_user_id uuid, p_action text, p_resource_type text, p_resource_id uuid DEFAULT NULL::uuid, p_details jsonb DEFAULT NULL::jsonb) RETURNS uuid
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public', 'pg_catalog'
    AS $$
DECLARE
  audit_id uuid;
BEGIN
  INSERT INTO public.audit_logs (
    account_id,
    user_id,
    action,
    resource_type,
    resource_id,
    details
  )
  VALUES (
    p_account_id,
    p_user_id,
    p_action,
    p_resource_type,
    p_resource_id,
    p_details
  )
  RETURNING id INTO audit_id;

  RETURN audit_id;
END;
$$;


--
-- Name: log_audit_event(uuid, uuid, character varying, character varying, uuid, jsonb); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.log_audit_event(p_account_id uuid, p_user_id uuid, p_action character varying, p_resource_type character varying, p_resource_id uuid DEFAULT NULL::uuid, p_details jsonb DEFAULT NULL::jsonb) RETURNS uuid
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
DECLARE
  audit_id UUID;
BEGIN
  INSERT INTO audit_logs (
    account_id,
    user_id,
    action,
    resource_type,
    resource_id,
    details
  )
  VALUES (
    p_account_id,
    p_user_id,
    p_action,
    p_resource_type,
    p_resource_id,
    p_details
  )
  RETURNING id INTO audit_id;

  RETURN audit_id;
END;
$$;


--
-- Name: refresh_dashboard_views(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.refresh_dashboard_views() RETURNS void
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY dashboard_summary;
  REFRESH MATERIALIZED VIEW CONCURRENTLY form_analytics;
  REFRESH MATERIALIZED VIEW CONCURRENTLY response_trends;
END;
$$;


--
-- Name: reorder_questions(uuid, uuid[], integer[]); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.reorder_questions(form_uuid uuid, question_ids uuid[], order_indexes integer[]) RETURNS void
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
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


--
-- Name: update_updated_at_column(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.update_updated_at_column() RETURNS trigger
    LANGUAGE plpgsql
    SET search_path TO 'public'
    AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;


--
-- Name: update_usage_counters(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.update_usage_counters() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
DECLARE
  account_uuid UUID;
  current_period_start DATE;
  current_period_end DATE;
BEGIN
  -- Determine which table triggered this
  IF TG_TABLE_NAME = 'projects' THEN
    account_uuid := NEW.account_id;
  ELSIF TG_TABLE_NAME = 'forms' THEN
    SELECT account_id INTO account_uuid
    FROM projects WHERE id = NEW.project_id;
  ELSIF TG_TABLE_NAME = 'responses' THEN
    SELECT p.account_id INTO account_uuid
    FROM forms f
    JOIN projects p ON f.project_id = p.id
    WHERE f.id = NEW.form_id;
  ELSIF TG_TABLE_NAME = 'qr_codes' THEN
    SELECT p.account_id INTO account_uuid
    FROM forms f
    JOIN projects p ON f.project_id = p.id
    WHERE f.id = NEW.form_id;
  END IF;

  -- Calculate current month period
  current_period_start := DATE_TRUNC('month', CURRENT_DATE)::DATE;
  current_period_end := (DATE_TRUNC('month', CURRENT_DATE) + INTERVAL '1 month' - INTERVAL '1 day')::DATE;

  -- Insert or update usage counter
  INSERT INTO usage_counters (
    account_id,
    period_start,
    period_end,
    projects_count,
    forms_count,
    responses_count,
    qr_scans_count
  )
  VALUES (
    account_uuid,
    current_period_start,
    current_period_end,
    CASE WHEN TG_TABLE_NAME = 'projects' THEN 1 ELSE 0 END,
    CASE WHEN TG_TABLE_NAME = 'forms' THEN 1 ELSE 0 END,
    CASE WHEN TG_TABLE_NAME = 'responses' THEN 1 ELSE 0 END,
    0
  )
  ON CONFLICT (account_id, period_start)
  DO UPDATE SET
    projects_count = usage_counters.projects_count + CASE WHEN TG_TABLE_NAME = 'projects' THEN 1 ELSE 0 END,
    forms_count = usage_counters.forms_count + CASE WHEN TG_TABLE_NAME = 'forms' THEN 1 ELSE 0 END,
    responses_count = usage_counters.responses_count + CASE WHEN TG_TABLE_NAME = 'responses' THEN 1 ELSE 0 END,
    updated_at = NOW();

  RETURN NEW;
END;
$$;


--
-- Name: accounts; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.accounts (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    name character varying(100) NOT NULL,
    plan_id uuid NOT NULL,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    onboarding_completed boolean DEFAULT false NOT NULL
);


--
-- Name: audit_logs; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.audit_logs (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    account_id uuid,
    user_id uuid,
    action character varying(50) NOT NULL,
    resource_type character varying(50) NOT NULL,
    resource_id uuid,
    details jsonb,
    ip_address inet,
    user_agent text,
    created_at timestamp with time zone DEFAULT now()
);


--
-- Name: plans; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.plans (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name character varying(50) NOT NULL,
    price integer DEFAULT 0 NOT NULL,
    max_projects integer DEFAULT 1 NOT NULL,
    max_forms_per_project integer DEFAULT 3 NOT NULL,
    max_responses_per_form integer DEFAULT 50 NOT NULL,
    features jsonb DEFAULT '[]'::jsonb NOT NULL,
    is_active boolean DEFAULT true NOT NULL,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


--
-- Name: questions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.questions (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    form_id uuid NOT NULL,
    type public.question_type NOT NULL,
    title character varying(200) NOT NULL,
    description text,
    required boolean DEFAULT false NOT NULL,
    options jsonb,
    order_index integer NOT NULL,
    created_at timestamp with time zone DEFAULT now(),
    rating_scale integer
);


--
-- Name: COLUMN questions.rating_scale; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.questions.rating_scale IS 'Rating scale for rating questions: 5 for 1-5 star rating, 10 for 1-10 numerical scale';


--
-- Name: response_items; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.response_items (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    response_id uuid NOT NULL,
    question_id uuid NOT NULL,
    value text NOT NULL,
    created_at timestamp with time zone DEFAULT now()
);


--
-- Name: subscriptions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.subscriptions (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    account_id uuid NOT NULL,
    plan_id uuid NOT NULL,
    stripe_subscription_id character varying(100),
    status character varying(20) DEFAULT 'active'::character varying NOT NULL,
    current_period_start timestamp with time zone NOT NULL,
    current_period_end timestamp with time zone NOT NULL,
    cancel_at_period_end boolean DEFAULT false NOT NULL,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


--
-- Name: usage_counters; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.usage_counters (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    account_id uuid NOT NULL,
    period_start date NOT NULL,
    period_end date NOT NULL,
    projects_count integer DEFAULT 0 NOT NULL,
    forms_count integer DEFAULT 0 NOT NULL,
    responses_count integer DEFAULT 0 NOT NULL,
    qr_scans_count integer DEFAULT 0 NOT NULL,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


--
-- Name: accounts accounts_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.accounts
    ADD CONSTRAINT accounts_pkey PRIMARY KEY (id);


--
-- Name: accounts accounts_user_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.accounts
    ADD CONSTRAINT accounts_user_id_key UNIQUE (user_id);


--
-- Name: audit_logs audit_logs_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.audit_logs
    ADD CONSTRAINT audit_logs_pkey PRIMARY KEY (id);


--
-- Name: forms forms_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.forms
    ADD CONSTRAINT forms_pkey PRIMARY KEY (id);


--
-- Name: plans plans_name_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.plans
    ADD CONSTRAINT plans_name_key UNIQUE (name);


--
-- Name: plans plans_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.plans
    ADD CONSTRAINT plans_pkey PRIMARY KEY (id);


--
-- Name: projects projects_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.projects
    ADD CONSTRAINT projects_pkey PRIMARY KEY (id);


--
-- Name: qr_codes qr_codes_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.qr_codes
    ADD CONSTRAINT qr_codes_pkey PRIMARY KEY (id);


--
-- Name: qr_codes qr_codes_short_url_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.qr_codes
    ADD CONSTRAINT qr_codes_short_url_key UNIQUE (short_url);


--
-- Name: questions questions_form_id_order_index_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.questions
    ADD CONSTRAINT questions_form_id_order_index_key UNIQUE (form_id, order_index) DEFERRABLE INITIALLY DEFERRED;


--
-- Name: questions questions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.questions
    ADD CONSTRAINT questions_pkey PRIMARY KEY (id);


--
-- Name: response_items response_items_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.response_items
    ADD CONSTRAINT response_items_pkey PRIMARY KEY (id);


--
-- Name: response_items response_items_response_id_question_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.response_items
    ADD CONSTRAINT response_items_response_id_question_id_key UNIQUE (response_id, question_id);


--
-- Name: responses responses_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.responses
    ADD CONSTRAINT responses_pkey PRIMARY KEY (id);


--
-- Name: subscriptions subscriptions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.subscriptions
    ADD CONSTRAINT subscriptions_pkey PRIMARY KEY (id);


--
-- Name: subscriptions subscriptions_stripe_subscription_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.subscriptions
    ADD CONSTRAINT subscriptions_stripe_subscription_id_key UNIQUE (stripe_subscription_id);


--
-- Name: usage_counters usage_counters_account_id_period_start_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.usage_counters
    ADD CONSTRAINT usage_counters_account_id_period_start_key UNIQUE (account_id, period_start);


--
-- Name: usage_counters usage_counters_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.usage_counters
    ADD CONSTRAINT usage_counters_pkey PRIMARY KEY (id);


--
-- Name: idx_accounts_plan_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_accounts_plan_id ON public.accounts USING btree (plan_id);


--
-- Name: idx_accounts_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_accounts_user_id ON public.accounts USING btree (user_id);


--
-- Name: idx_audit_logs_account_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_audit_logs_account_id ON public.audit_logs USING btree (account_id);


--
-- Name: idx_audit_logs_created_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_audit_logs_created_at ON public.audit_logs USING btree (created_at);


--
-- Name: idx_audit_logs_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_audit_logs_user_id ON public.audit_logs USING btree (user_id);


--
-- Name: idx_dashboard_summary_account_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_dashboard_summary_account_id ON public.dashboard_summary USING btree (account_id);


--
-- Name: idx_form_analytics_account_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_form_analytics_account_id ON public.form_analytics USING btree (account_id);


--
-- Name: idx_form_analytics_form_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_form_analytics_form_id ON public.form_analytics USING btree (form_id);


--
-- Name: idx_forms_project_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_forms_project_id ON public.forms USING btree (project_id);


--
-- Name: idx_projects_account_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_projects_account_id ON public.projects USING btree (account_id);


--
-- Name: idx_qr_codes_form_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_qr_codes_form_id ON public.qr_codes USING btree (form_id);


--
-- Name: idx_qr_codes_short_url; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_qr_codes_short_url ON public.qr_codes USING btree (short_url);


--
-- Name: idx_questions_form_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_questions_form_id ON public.questions USING btree (form_id);


--
-- Name: idx_questions_order; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_questions_order ON public.questions USING btree (form_id, order_index);


--
-- Name: idx_response_items_question_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_response_items_question_id ON public.response_items USING btree (question_id);


--
-- Name: idx_response_items_response_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_response_items_response_id ON public.response_items USING btree (response_id);


--
-- Name: idx_response_trends_account_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_response_trends_account_id ON public.response_trends USING btree (account_id);


--
-- Name: idx_response_trends_date; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_response_trends_date ON public.response_trends USING btree (response_date);


--
-- Name: idx_response_trends_form_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_response_trends_form_id ON public.response_trends USING btree (form_id);


--
-- Name: idx_responses_form_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_responses_form_id ON public.responses USING btree (form_id);


--
-- Name: idx_responses_qr_code_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_responses_qr_code_id ON public.responses USING btree (qr_code_id);


--
-- Name: idx_responses_submitted_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_responses_submitted_at ON public.responses USING btree (submitted_at);


--
-- Name: idx_subscriptions_account_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_subscriptions_account_id ON public.subscriptions USING btree (account_id);


--
-- Name: idx_subscriptions_plan_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_subscriptions_plan_id ON public.subscriptions USING btree (plan_id);


--
-- Name: idx_usage_counters_account_period; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_usage_counters_account_period ON public.usage_counters USING btree (account_id, period_start);


--
-- Name: forms track_form_usage; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER track_form_usage AFTER INSERT ON public.forms FOR EACH ROW EXECUTE FUNCTION public.update_usage_counters();


--
-- Name: projects track_project_usage; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER track_project_usage AFTER INSERT ON public.projects FOR EACH ROW EXECUTE FUNCTION public.update_usage_counters();


--
-- Name: responses track_response_usage; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER track_response_usage AFTER INSERT ON public.responses FOR EACH ROW EXECUTE FUNCTION public.update_usage_counters();


--
-- Name: accounts update_accounts_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_accounts_updated_at BEFORE UPDATE ON public.accounts FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: forms update_forms_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_forms_updated_at BEFORE UPDATE ON public.forms FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: projects update_projects_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_projects_updated_at BEFORE UPDATE ON public.projects FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: subscriptions update_subscriptions_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_subscriptions_updated_at BEFORE UPDATE ON public.subscriptions FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: usage_counters update_usage_counters_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_usage_counters_updated_at BEFORE UPDATE ON public.usage_counters FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: accounts accounts_plan_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.accounts
    ADD CONSTRAINT accounts_plan_id_fkey FOREIGN KEY (plan_id) REFERENCES public.plans(id);


--
-- Name: accounts accounts_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.accounts
    ADD CONSTRAINT accounts_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: audit_logs audit_logs_account_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.audit_logs
    ADD CONSTRAINT audit_logs_account_id_fkey FOREIGN KEY (account_id) REFERENCES public.accounts(id) ON DELETE CASCADE;


--
-- Name: audit_logs audit_logs_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.audit_logs
    ADD CONSTRAINT audit_logs_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: forms forms_project_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.forms
    ADD CONSTRAINT forms_project_id_fkey FOREIGN KEY (project_id) REFERENCES public.projects(id) ON DELETE CASCADE;


--
-- Name: projects projects_account_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.projects
    ADD CONSTRAINT projects_account_id_fkey FOREIGN KEY (account_id) REFERENCES public.accounts(id) ON DELETE CASCADE;


--
-- Name: qr_codes qr_codes_form_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.qr_codes
    ADD CONSTRAINT qr_codes_form_id_fkey FOREIGN KEY (form_id) REFERENCES public.forms(id) ON DELETE CASCADE;


--
-- Name: questions questions_form_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.questions
    ADD CONSTRAINT questions_form_id_fkey FOREIGN KEY (form_id) REFERENCES public.forms(id) ON DELETE CASCADE;


--
-- Name: response_items response_items_question_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.response_items
    ADD CONSTRAINT response_items_question_id_fkey FOREIGN KEY (question_id) REFERENCES public.questions(id) ON DELETE CASCADE;


--
-- Name: response_items response_items_response_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.response_items
    ADD CONSTRAINT response_items_response_id_fkey FOREIGN KEY (response_id) REFERENCES public.responses(id) ON DELETE CASCADE;


--
-- Name: responses responses_form_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.responses
    ADD CONSTRAINT responses_form_id_fkey FOREIGN KEY (form_id) REFERENCES public.forms(id) ON DELETE CASCADE;


--
-- Name: responses responses_qr_code_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.responses
    ADD CONSTRAINT responses_qr_code_id_fkey FOREIGN KEY (qr_code_id) REFERENCES public.qr_codes(id);


--
-- Name: subscriptions subscriptions_account_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.subscriptions
    ADD CONSTRAINT subscriptions_account_id_fkey FOREIGN KEY (account_id) REFERENCES public.accounts(id) ON DELETE CASCADE;


--
-- Name: subscriptions subscriptions_plan_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.subscriptions
    ADD CONSTRAINT subscriptions_plan_id_fkey FOREIGN KEY (plan_id) REFERENCES public.plans(id);


--
-- Name: usage_counters usage_counters_account_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.usage_counters
    ADD CONSTRAINT usage_counters_account_id_fkey FOREIGN KEY (account_id) REFERENCES public.accounts(id) ON DELETE CASCADE;


--
-- Name: response_items Anyone can submit response items for valid responses; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Anyone can submit response items for valid responses" ON public.response_items FOR INSERT TO anon WITH CHECK ((response_id IN ( SELECT r.id
   FROM (public.responses r
     JOIN public.forms f ON ((r.form_id = f.id)))
  WHERE (f.is_active = true))));


--
-- Name: responses Anyone can submit responses to active forms; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Anyone can submit responses to active forms" ON public.responses FOR INSERT TO anon WITH CHECK ((form_id IN ( SELECT f.id
   FROM public.forms f
  WHERE (f.is_active = true))));


--
-- Name: response_items Authenticated can submit response items for active forms; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Authenticated can submit response items for active forms" ON public.response_items FOR INSERT TO authenticated WITH CHECK ((response_id IN ( SELECT r.id
   FROM (public.responses r
     JOIN public.forms f ON ((r.form_id = f.id)))
  WHERE (f.is_active = true))));


--
-- Name: responses Authenticated can submit responses to active forms; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Authenticated can submit responses to active forms" ON public.responses FOR INSERT TO authenticated WITH CHECK ((form_id IN ( SELECT f.id
   FROM public.forms f
  WHERE (f.is_active = true))));


--
-- Name: forms Authenticated can view forms; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Authenticated can view forms" ON public.forms FOR SELECT TO authenticated USING (((is_active = true) OR (project_id IN ( SELECT projects.id
   FROM public.projects
  WHERE (projects.account_id = public.get_user_account_id())))));


--
-- Name: qr_codes Authenticated can view qr codes; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Authenticated can view qr codes" ON public.qr_codes FOR SELECT TO authenticated USING ((form_id IN ( SELECT forms.id
   FROM public.forms
  WHERE ((forms.is_active = true) OR (forms.project_id IN ( SELECT projects.id
           FROM public.projects
          WHERE (projects.account_id = public.get_user_account_id())))))));


--
-- Name: questions Authenticated can view questions; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Authenticated can view questions" ON public.questions FOR SELECT TO authenticated USING ((form_id IN ( SELECT forms.id
   FROM public.forms
  WHERE ((forms.is_active = true) OR (forms.project_id IN ( SELECT projects.id
           FROM public.projects
          WHERE (projects.account_id = public.get_user_account_id())))))));


--
-- Name: plans Plans are readable by authenticated users; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Plans are readable by authenticated users" ON public.plans FOR SELECT TO authenticated USING (true);


--
-- Name: qr_codes Public can view QR codes for active forms; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Public can view QR codes for active forms" ON public.qr_codes FOR SELECT TO anon USING ((form_id IN ( SELECT forms.id
   FROM public.forms
  WHERE (forms.is_active = true))));


--
-- Name: forms Public can view active forms; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Public can view active forms" ON public.forms FOR SELECT TO anon USING ((is_active = true));


--
-- Name: projects Public can view projects for active forms; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Public can view projects for active forms" ON public.projects FOR SELECT TO anon USING ((EXISTS ( SELECT 1
   FROM public.forms
  WHERE ((forms.project_id = projects.id) AND (forms.is_active = true)))));


--
-- Name: questions Public can view questions for active forms; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Public can view questions for active forms" ON public.questions FOR SELECT TO anon USING ((form_id IN ( SELECT forms.id
   FROM public.forms
  WHERE (forms.is_active = true))));


--
-- Name: audit_logs Service can insert audit logs; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Service can insert audit logs" ON public.audit_logs FOR INSERT TO service_role WITH CHECK (true);


--
-- Name: qr_codes Users can create QR codes for their account's forms; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can create QR codes for their account's forms" ON public.qr_codes FOR INSERT TO authenticated WITH CHECK ((form_id IN ( SELECT f.id
   FROM (public.forms f
     JOIN public.projects p ON ((f.project_id = p.id)))
  WHERE (p.account_id = public.get_user_account_id()))));


--
-- Name: forms Users can create forms in their account's projects; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can create forms in their account's projects" ON public.forms FOR INSERT TO authenticated WITH CHECK ((project_id IN ( SELECT projects.id
   FROM public.projects
  WHERE (projects.account_id = public.get_user_account_id()))));


--
-- Name: projects Users can create projects in their account; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can create projects in their account" ON public.projects FOR INSERT TO authenticated WITH CHECK ((account_id = public.get_user_account_id()));


--
-- Name: questions Users can create questions in their account's forms; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can create questions in their account's forms" ON public.questions FOR INSERT TO authenticated WITH CHECK ((form_id IN ( SELECT f.id
   FROM (public.forms f
     JOIN public.projects p ON ((f.project_id = p.id)))
  WHERE (p.account_id = public.get_user_account_id()))));


--
-- Name: subscriptions Users can create subscriptions for their account; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can create subscriptions for their account" ON public.subscriptions FOR INSERT TO authenticated WITH CHECK ((account_id = public.get_user_account_id()));


--
-- Name: accounts Users can create their own account; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can create their own account" ON public.accounts FOR INSERT TO authenticated WITH CHECK ((user_id = ( SELECT auth.uid() AS uid)));


--
-- Name: usage_counters Users can create usage counters for their account; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can create usage counters for their account" ON public.usage_counters FOR INSERT TO authenticated WITH CHECK ((account_id = public.get_user_account_id()));


--
-- Name: qr_codes Users can delete QR codes for their account's forms; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can delete QR codes for their account's forms" ON public.qr_codes FOR DELETE TO authenticated USING ((form_id IN ( SELECT f.id
   FROM (public.forms f
     JOIN public.projects p ON ((f.project_id = p.id)))
  WHERE (p.account_id = public.get_user_account_id()))));


--
-- Name: forms Users can delete forms in their account's projects; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can delete forms in their account's projects" ON public.forms FOR DELETE TO authenticated USING ((project_id IN ( SELECT projects.id
   FROM public.projects
  WHERE (projects.account_id = public.get_user_account_id()))));


--
-- Name: questions Users can delete questions in their account's forms; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can delete questions in their account's forms" ON public.questions FOR DELETE TO authenticated USING ((form_id IN ( SELECT f.id
   FROM (public.forms f
     JOIN public.projects p ON ((f.project_id = p.id)))
  WHERE (p.account_id = public.get_user_account_id()))));


--
-- Name: projects Users can delete their account's projects; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can delete their account's projects" ON public.projects FOR DELETE TO authenticated USING ((account_id = public.get_user_account_id()));


--
-- Name: accounts Users can delete their own account; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can delete their own account" ON public.accounts FOR DELETE TO authenticated USING ((user_id = ( SELECT auth.uid() AS uid)));


--
-- Name: response_items Users can read response items for their account's forms; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can read response items for their account's forms" ON public.response_items FOR SELECT TO authenticated USING ((response_id IN ( SELECT r.id
   FROM ((public.responses r
     JOIN public.forms f ON ((r.form_id = f.id)))
     JOIN public.projects p ON ((f.project_id = p.id)))
  WHERE (p.account_id = public.get_user_account_id()))));


--
-- Name: responses Users can read responses to their account's forms; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can read responses to their account's forms" ON public.responses FOR SELECT TO authenticated USING ((form_id IN ( SELECT f.id
   FROM (public.forms f
     JOIN public.projects p ON ((f.project_id = p.id)))
  WHERE (p.account_id = public.get_user_account_id()))));


--
-- Name: audit_logs Users can read their account's audit logs; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can read their account's audit logs" ON public.audit_logs FOR SELECT TO authenticated USING ((account_id = public.get_user_account_id()));


--
-- Name: projects Users can read their account's projects; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can read their account's projects" ON public.projects FOR SELECT TO authenticated USING ((account_id = public.get_user_account_id()));


--
-- Name: subscriptions Users can read their account's subscriptions; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can read their account's subscriptions" ON public.subscriptions FOR SELECT TO authenticated USING ((account_id = public.get_user_account_id()));


--
-- Name: usage_counters Users can read their account's usage counters; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can read their account's usage counters" ON public.usage_counters FOR SELECT TO authenticated USING ((account_id = public.get_user_account_id()));


--
-- Name: accounts Users can read their own account; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can read their own account" ON public.accounts FOR SELECT TO authenticated USING ((user_id = ( SELECT auth.uid() AS uid)));


--
-- Name: qr_codes Users can update QR codes for their account's forms; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can update QR codes for their account's forms" ON public.qr_codes FOR UPDATE TO authenticated USING ((form_id IN ( SELECT f.id
   FROM (public.forms f
     JOIN public.projects p ON ((f.project_id = p.id)))
  WHERE (p.account_id = public.get_user_account_id()))));


--
-- Name: forms Users can update forms in their account's projects; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can update forms in their account's projects" ON public.forms FOR UPDATE TO authenticated USING ((project_id IN ( SELECT projects.id
   FROM public.projects
  WHERE (projects.account_id = public.get_user_account_id()))));


--
-- Name: questions Users can update questions in their account's forms; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can update questions in their account's forms" ON public.questions FOR UPDATE TO authenticated USING ((form_id IN ( SELECT f.id
   FROM (public.forms f
     JOIN public.projects p ON ((f.project_id = p.id)))
  WHERE (p.account_id = public.get_user_account_id()))));


--
-- Name: projects Users can update their account's projects; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can update their account's projects" ON public.projects FOR UPDATE TO authenticated USING ((account_id = public.get_user_account_id()));


--
-- Name: subscriptions Users can update their account's subscriptions; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can update their account's subscriptions" ON public.subscriptions FOR UPDATE TO authenticated USING ((account_id = public.get_user_account_id()));


--
-- Name: usage_counters Users can update their account's usage counters; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can update their account's usage counters" ON public.usage_counters FOR UPDATE TO authenticated USING ((account_id = public.get_user_account_id()));


--
-- Name: accounts Users can update their own account; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can update their own account" ON public.accounts FOR UPDATE TO authenticated USING ((user_id = ( SELECT auth.uid() AS uid)));


--
-- Name: accounts; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.accounts ENABLE ROW LEVEL SECURITY;

--
-- Name: accounts accounts_insert_service; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY accounts_insert_service ON public.accounts FOR INSERT TO service_role WITH CHECK (true);


--
-- Name: audit_logs; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

--
-- Name: forms; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.forms ENABLE ROW LEVEL SECURITY;

--
-- Name: plans; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.plans ENABLE ROW LEVEL SECURITY;

--
-- Name: projects; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;

--
-- Name: qr_codes; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.qr_codes ENABLE ROW LEVEL SECURITY;

--
-- Name: questions; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.questions ENABLE ROW LEVEL SECURITY;

--
-- Name: response_items; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.response_items ENABLE ROW LEVEL SECURITY;

--
-- Name: responses; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.responses ENABLE ROW LEVEL SECURITY;

--
-- Name: subscriptions; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

--
-- Name: usage_counters; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.usage_counters ENABLE ROW LEVEL SECURITY;

--
-- PostgreSQL database dump complete
--

\unrestrict F9x0QzeEs1LrmzGM1YaAntMVdDUKEJP4JdNExxbs0Wxw8lcBxsMLHSTMpdiK0Qh

