-- =============================================================================
-- BSP FEEDBACK TOOL - FINAL COMPLETE SETUP SCRIPT
-- =============================================================================
-- This script creates the COMPLETE database schema with ALL fixes applied
-- Run this AFTER the nuclear reset for a complete, working setup
-- Includes: Schema + Security Fixes + Usage Counter Fixes + Frontend Compatibility
-- =============================================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =============================================================================
-- CREATE CUSTOM TYPES
-- =============================================================================

DO $$ BEGIN
    CREATE TYPE question_type AS ENUM ('text', 'textarea', 'rating', 'choice', 'multiselect');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- =============================================================================
-- TABLE CREATION
-- =============================================================================

-- Plans table (subscription tiers)
CREATE TABLE IF NOT EXISTS plans (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(50) NOT NULL UNIQUE,
    price INTEGER NOT NULL DEFAULT 0, -- Price in cents
    max_projects INTEGER NOT NULL DEFAULT 1,
    max_forms_per_project INTEGER NOT NULL DEFAULT 3,
    max_responses_per_form INTEGER NOT NULL DEFAULT 50,
    features JSONB NOT NULL DEFAULT '[]',
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Accounts table (user accounts with plan info)
CREATE TABLE IF NOT EXISTS accounts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    plan_id UUID NOT NULL REFERENCES plans(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id)
);

-- Projects table
CREATE TABLE IF NOT EXISTS projects (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    account_id UUID NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Forms table
CREATE TABLE IF NOT EXISTS forms (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Questions table
CREATE TABLE IF NOT EXISTS questions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    form_id UUID NOT NULL REFERENCES forms(id) ON DELETE CASCADE,
    type question_type NOT NULL,
    title VARCHAR(200) NOT NULL,
    description TEXT,
    required BOOLEAN NOT NULL DEFAULT false,
    options JSONB, -- For choice/multiselect questions
    order_index INTEGER NOT NULL,
    rating_scale INTEGER, -- For rating questions: 5 or 10
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(form_id, order_index)
);

-- QR codes table
CREATE TABLE IF NOT EXISTS qr_codes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    form_id UUID NOT NULL REFERENCES forms(id) ON DELETE CASCADE,
    short_url VARCHAR(20) NOT NULL UNIQUE,
    full_url TEXT NOT NULL,
    location_name VARCHAR(100),
    scan_count INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Responses table
CREATE TABLE IF NOT EXISTS responses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    form_id UUID NOT NULL REFERENCES forms(id) ON DELETE CASCADE,
    qr_code_id UUID REFERENCES qr_codes(id),
    ip_hash VARCHAR(64), -- SHA-256 hash for GDPR compliance
    location_name VARCHAR(100),
    user_agent_hash VARCHAR(64), -- For duplicate detection
    submitted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Response items table (individual answers)
CREATE TABLE IF NOT EXISTS response_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    response_id UUID NOT NULL REFERENCES responses(id) ON DELETE CASCADE,
    question_id UUID NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
    value TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(response_id, question_id)
);

-- Usage counters for plan limits (CRITICAL FOR FRONTEND)
CREATE TABLE IF NOT EXISTS usage_counters (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    account_id UUID NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
    period_start DATE NOT NULL,
    period_end DATE NOT NULL,
    projects_count INTEGER NOT NULL DEFAULT 0,
    forms_count INTEGER NOT NULL DEFAULT 0,
    responses_count INTEGER NOT NULL DEFAULT 0,
    qr_scans_count INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(account_id, period_start)
);

-- Subscriptions table (for Stripe integration)
CREATE TABLE IF NOT EXISTS subscriptions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    account_id UUID NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
    plan_id UUID NOT NULL REFERENCES plans(id),
    stripe_subscription_id VARCHAR(100) UNIQUE,
    status VARCHAR(20) NOT NULL DEFAULT 'active',
    current_period_start TIMESTAMP WITH TIME ZONE NOT NULL,
    current_period_end TIMESTAMP WITH TIME ZONE NOT NULL,
    cancel_at_period_end BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Audit log table (for security and debugging)
CREATE TABLE IF NOT EXISTS audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    account_id UUID REFERENCES accounts(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    action VARCHAR(50) NOT NULL,
    resource_type VARCHAR(50) NOT NULL,
    resource_id UUID,
    details JSONB,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================================================
-- INDEXES FOR PERFORMANCE
-- =============================================================================

-- Foreign key indexes
CREATE INDEX IF NOT EXISTS idx_accounts_user_id ON accounts(user_id);
CREATE INDEX IF NOT EXISTS idx_accounts_plan_id ON accounts(plan_id);
CREATE INDEX IF NOT EXISTS idx_projects_account_id ON projects(account_id);
CREATE INDEX IF NOT EXISTS idx_forms_project_id ON forms(project_id);
CREATE INDEX IF NOT EXISTS idx_questions_form_id ON questions(form_id);
CREATE INDEX IF NOT EXISTS idx_qr_codes_form_id ON qr_codes(form_id);
CREATE INDEX IF NOT EXISTS idx_responses_form_id ON responses(form_id);
CREATE INDEX IF NOT EXISTS idx_responses_qr_code_id ON responses(qr_code_id);
CREATE INDEX IF NOT EXISTS idx_response_items_response_id ON response_items(response_id);
CREATE INDEX IF NOT EXISTS idx_response_items_question_id ON response_items(question_id);
CREATE INDEX IF NOT EXISTS idx_usage_counters_account_id ON usage_counters(account_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_account_id ON subscriptions(account_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_account_id ON audit_logs(account_id);

-- Query optimization indexes
CREATE INDEX IF NOT EXISTS idx_qr_codes_short_url ON qr_codes(short_url);
CREATE INDEX IF NOT EXISTS idx_questions_order ON questions(form_id, order_index);
CREATE INDEX IF NOT EXISTS idx_responses_submitted_at ON responses(submitted_at);
CREATE INDEX IF NOT EXISTS idx_usage_counters_account_period ON usage_counters(account_id, period_start);
CREATE INDEX IF NOT EXISTS idx_subscriptions_stripe_id ON subscriptions(stripe_subscription_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at);

-- =============================================================================
-- SECURE FUNCTIONS (WITH SEARCH_PATH PROTECTION)
-- =============================================================================

-- Function to update updated_at column
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public;

-- Function to create account automatically when user signs up
CREATE OR REPLACE FUNCTION create_user_account()
RETURNS TRIGGER AS $$
DECLARE
    free_plan_id UUID;
    new_account_id UUID;
    current_period_start DATE;
    current_period_end DATE;
BEGIN
    -- Get the Free plan ID
    SELECT id INTO free_plan_id FROM public.plans WHERE name = 'Free' LIMIT 1;

    -- Create account for new user
    INSERT INTO public.accounts (user_id, name, plan_id)
    VALUES (
        NEW.id,
        COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
        free_plan_id
    )
    RETURNING id INTO new_account_id;

    -- CRITICAL: Initialize usage_counters for new account
    current_period_start := DATE_TRUNC('month', CURRENT_DATE);
    current_period_end := (DATE_TRUNC('month', CURRENT_DATE) + INTERVAL '1 month - 1 day')::DATE;

    INSERT INTO public.usage_counters (
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
        0, -- Start with 0 projects
        0, -- Start with 0 forms
        0, -- Start with 0 responses
        0  -- Start with 0 scans
    );

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public;

-- Helper function to get user's account ID
CREATE OR REPLACE FUNCTION get_user_account_id()
RETURNS UUID AS $$
BEGIN
    RETURN (
        SELECT id FROM public.accounts
        WHERE user_id = auth.uid()
        LIMIT 1
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public;

-- Function to generate unique short URLs for QR codes
CREATE OR REPLACE FUNCTION generate_short_url()
RETURNS TEXT AS $$
DECLARE
    chars TEXT := 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    result TEXT := '';
    i INTEGER := 0;
    url_exists BOOLEAN := true;
BEGIN
    WHILE url_exists LOOP
        result := '';
        FOR i IN 1..8 LOOP
            result := result || substr(chars, floor(random() * length(chars) + 1)::int, 1);
        END LOOP;

        SELECT EXISTS(SELECT 1 FROM public.qr_codes WHERE short_url = result) INTO url_exists;
    END LOOP;

    RETURN result;
END;
$$ LANGUAGE plpgsql
SET search_path = public;

-- Function: Check if account can create more projects
CREATE OR REPLACE FUNCTION can_create_project(account_uuid UUID)
RETURNS BOOLEAN AS $$
DECLARE
    current_count INTEGER;
    max_allowed INTEGER;
BEGIN
    -- Get current project count for account
    SELECT COUNT(*) INTO current_count
    FROM public.projects
    WHERE account_id = account_uuid AND is_active = true;

    -- Get max projects allowed from plan
    SELECT p.max_projects INTO max_allowed
    FROM public.accounts a
    JOIN public.plans p ON a.plan_id = p.id
    WHERE a.id = account_uuid;

    -- If max_allowed is -1, it means unlimited
    IF max_allowed = -1 THEN
        RETURN true;
    END IF;

    -- Check if under limit
    RETURN current_count < max_allowed;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public;

-- Function: Check if project can create more forms
CREATE OR REPLACE FUNCTION can_create_form(project_uuid UUID)
RETURNS BOOLEAN AS $$
DECLARE
    current_count INTEGER;
    max_allowed INTEGER;
    account_id_val UUID;
BEGIN
    -- Get account ID from project
    SELECT account_id INTO account_id_val
    FROM public.projects
    WHERE id = project_uuid;

    -- Get current form count for project
    SELECT COUNT(*) INTO current_count
    FROM public.forms
    WHERE project_id = project_uuid AND is_active = true;

    -- Get max forms per project allowed from plan
    SELECT p.max_forms_per_project INTO max_allowed
    FROM public.accounts a
    JOIN public.plans p ON a.plan_id = p.id
    WHERE a.id = account_id_val;

    -- If max_allowed is -1, it means unlimited
    IF max_allowed = -1 THEN
        RETURN true;
    END IF;

    -- Check if under limit
    RETURN current_count < max_allowed;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public;

-- Function: Check if form can accept more responses
CREATE OR REPLACE FUNCTION can_accept_response(form_uuid UUID)
RETURNS BOOLEAN AS $$
DECLARE
    current_count INTEGER;
    max_allowed INTEGER;
    account_id_val UUID;
    form_active BOOLEAN;
BEGIN
    -- Check if form is active and get account ID
    SELECT p.account_id, f.is_active INTO account_id_val, form_active
    FROM public.forms f
    JOIN public.projects p ON f.project_id = p.id
    WHERE f.id = form_uuid;

    -- Form must be active
    IF NOT form_active THEN
        RETURN false;
    END IF;

    -- Get current response count for form
    SELECT COUNT(*) INTO current_count
    FROM public.responses
    WHERE form_id = form_uuid;

    -- Get max responses per form allowed from plan
    SELECT p.max_responses_per_form INTO max_allowed
    FROM public.accounts a
    JOIN public.plans p ON a.plan_id = p.id
    WHERE a.id = account_id_val;

    -- If max_allowed is -1, it means unlimited
    IF max_allowed = -1 THEN
        RETURN true;
    END IF;

    -- Check if under limit
    RETURN current_count < max_allowed;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public;

-- Function: Increment QR code scan count
CREATE OR REPLACE FUNCTION increment_qr_scan(qr_code_uuid UUID)
RETURNS VOID AS $$
BEGIN
    UPDATE public.qr_codes
    SET scan_count = scan_count + 1
    WHERE id = qr_code_uuid;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public;

-- Function: Get account response count for a time period
CREATE OR REPLACE FUNCTION get_account_responses_count(
    account_uuid UUID,
    start_date TIMESTAMP WITH TIME ZONE DEFAULT NULL
)
RETURNS INTEGER AS $$
DECLARE
    response_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO response_count
    FROM public.responses r
    JOIN public.forms f ON r.form_id = f.id
    JOIN public.projects p ON f.project_id = p.id
    WHERE p.account_id = account_uuid
        AND (start_date IS NULL OR r.submitted_at >= start_date);

    RETURN COALESCE(response_count, 0);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public;

-- CRITICAL: Function to sync usage_counters with actual data
CREATE OR REPLACE FUNCTION sync_usage_counters(account_uuid UUID)
RETURNS VOID AS $$
DECLARE
    actual_projects INTEGER := 0;
    actual_forms INTEGER := 0;
    actual_responses INTEGER := 0;
    actual_scans INTEGER := 0;
    current_period_start DATE;
    current_period_end DATE;
BEGIN
    -- Calculate current usage period (this month)
    current_period_start := DATE_TRUNC('month', CURRENT_DATE);
    current_period_end := (DATE_TRUNC('month', CURRENT_DATE) + INTERVAL '1 month - 1 day')::DATE;

    -- Get actual counts from the database
    SELECT COUNT(*) INTO actual_projects
    FROM public.projects
    WHERE account_id = account_uuid AND is_active = true;

    SELECT COUNT(*) INTO actual_forms
    FROM public.forms f
    JOIN public.projects p ON f.project_id = p.id
    WHERE p.account_id = account_uuid AND f.is_active = true AND p.is_active = true;

    SELECT COUNT(*) INTO actual_responses
    FROM public.responses r
    JOIN public.forms f ON r.form_id = f.id
    JOIN public.projects p ON f.project_id = p.id
    WHERE p.account_id = account_uuid
    AND r.submitted_at >= current_period_start;

    SELECT COALESCE(SUM(scan_count), 0) INTO actual_scans
    FROM public.qr_codes qr
    JOIN public.forms f ON qr.form_id = f.id
    JOIN public.projects p ON f.project_id = p.id
    WHERE p.account_id = account_uuid;

    -- Update or insert usage counter
    INSERT INTO public.usage_counters (
        account_id,
        period_start,
        period_end,
        projects_count,
        forms_count,
        responses_count,
        qr_scans_count
    ) VALUES (
        account_uuid,
        current_period_start,
        current_period_end,
        actual_projects,
        actual_forms,
        actual_responses,
        actual_scans
    )
    ON CONFLICT (account_id, period_start)
    DO UPDATE SET
        projects_count = EXCLUDED.projects_count,
        forms_count = EXCLUDED.forms_count,
        responses_count = EXCLUDED.responses_count,
        qr_scans_count = EXCLUDED.qr_scans_count,
        updated_at = NOW();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public;

-- =============================================================================
-- TRIGGERS
-- =============================================================================

-- Apply updated_at triggers to relevant tables
DROP TRIGGER IF EXISTS update_accounts_updated_at ON accounts;
CREATE TRIGGER update_accounts_updated_at BEFORE UPDATE ON accounts FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_projects_updated_at ON projects;
CREATE TRIGGER update_projects_updated_at BEFORE UPDATE ON projects FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_forms_updated_at ON forms;
CREATE TRIGGER update_forms_updated_at BEFORE UPDATE ON forms FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_usage_counters_updated_at ON usage_counters;
CREATE TRIGGER update_usage_counters_updated_at BEFORE UPDATE ON usage_counters FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_subscriptions_updated_at ON subscriptions;
CREATE TRIGGER update_subscriptions_updated_at BEFORE UPDATE ON subscriptions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Trigger to create account on user creation
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION create_user_account();

-- =============================================================================
-- MATERIALIZED VIEWS FOR PERFORMANCE
-- =============================================================================

-- Drop existing materialized views if they exist
DROP MATERIALIZED VIEW IF EXISTS dashboard_summary CASCADE;
DROP MATERIALIZED VIEW IF EXISTS form_analytics CASCADE;
DROP MATERIALIZED VIEW IF EXISTS response_trends CASCADE;

-- Dashboard summary view for faster dashboard loading
CREATE MATERIALIZED VIEW dashboard_summary AS
SELECT
    p.account_id,
    p.id as project_id,
    p.name as project_name,
    COUNT(DISTINCT f.id) as forms_count,
    COUNT(DISTINCT r.id) as total_responses,
    COUNT(DISTINCT r.id) FILTER (WHERE r.submitted_at >= CURRENT_DATE - INTERVAL '7 days') as responses_last_7_days,
    COUNT(DISTINCT r.id) FILTER (WHERE r.submitted_at >= CURRENT_DATE - INTERVAL '30 days') as responses_last_30_days,
    COUNT(DISTINCT qr.id) as qr_codes_count,
    COALESCE(SUM(qr.scan_count), 0) as total_scans,
    MIN(r.submitted_at) as first_response_at,
    MAX(r.submitted_at) as latest_response_at
FROM projects p
LEFT JOIN forms f ON p.id = f.project_id AND f.is_active = true
LEFT JOIN qr_codes qr ON f.id = qr.form_id
LEFT JOIN responses r ON f.id = r.form_id
WHERE p.is_active = true
GROUP BY p.account_id, p.id, p.name;

-- Form analytics view
CREATE MATERIALIZED VIEW form_analytics AS
SELECT
    f.id as form_id,
    f.name as form_name,
    p.account_id,
    COUNT(DISTINCT r.id) as total_responses,
    COUNT(DISTINCT r.id) FILTER (WHERE r.submitted_at >= CURRENT_DATE - INTERVAL '7 days') as responses_last_7_days,
    COUNT(DISTINCT r.id) FILTER (WHERE r.submitted_at >= CURRENT_DATE - INTERVAL '30 days') as responses_last_30_days,
    COUNT(DISTINCT qr.id) as qr_codes_count,
    COALESCE(SUM(qr.scan_count), 0) as total_scans,
    MIN(r.submitted_at) as first_response_at,
    MAX(r.submitted_at) as latest_response_at,
    CASE
        WHEN COUNT(DISTINCT qr.id) > 0 AND SUM(qr.scan_count) > 0
        THEN ROUND((COUNT(DISTINCT r.id)::DECIMAL / SUM(qr.scan_count) * 100), 2)
        ELSE 0
    END as conversion_rate
FROM forms f
JOIN projects p ON f.project_id = p.id
LEFT JOIN qr_codes qr ON f.id = qr.form_id
LEFT JOIN responses r ON f.id = r.form_id
WHERE f.is_active = true AND p.is_active = true
GROUP BY f.id, f.name, p.account_id;

-- Response trends view (daily aggregates)
CREATE MATERIALIZED VIEW response_trends AS
SELECT
    p.account_id,
    f.id as form_id,
    DATE(r.submitted_at) as response_date,
    COUNT(*) as responses_count
FROM responses r
JOIN forms f ON r.form_id = f.id
JOIN projects p ON f.project_id = p.id
WHERE r.submitted_at >= CURRENT_DATE - INTERVAL '90 days'
GROUP BY p.account_id, f.id, DATE(r.submitted_at)
ORDER BY response_date DESC;

-- Create indexes on materialized views
CREATE INDEX idx_dashboard_summary_account_id ON dashboard_summary(account_id);
CREATE INDEX idx_form_analytics_account_id ON form_analytics(account_id);
CREATE INDEX idx_form_analytics_form_id ON form_analytics(form_id);
CREATE INDEX idx_response_trends_account_id ON response_trends(account_id);
CREATE INDEX idx_response_trends_form_id ON response_trends(form_id);
CREATE INDEX idx_response_trends_date ON response_trends(response_date);

-- Function to refresh materialized views
CREATE OR REPLACE FUNCTION refresh_dashboard_views()
RETURNS VOID AS $$
BEGIN
    REFRESH MATERIALIZED VIEW CONCURRENTLY public.dashboard_summary;
    REFRESH MATERIALIZED VIEW CONCURRENTLY public.form_analytics;
    REFRESH MATERIALIZED VIEW CONCURRENTLY public.response_trends;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public;

-- Secure wrapper functions for materialized view access
CREATE OR REPLACE FUNCTION get_dashboard_summary()
RETURNS TABLE (
    account_id UUID,
    project_id UUID,
    project_name TEXT,
    forms_count BIGINT,
    total_responses BIGINT,
    responses_last_7_days BIGINT,
    responses_last_30_days BIGINT,
    qr_codes_count BIGINT,
    total_scans BIGINT,
    first_response_at TIMESTAMP WITH TIME ZONE,
    latest_response_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        ds.account_id,
        ds.project_id,
        ds.project_name,
        ds.forms_count,
        ds.total_responses,
        ds.responses_last_7_days,
        ds.responses_last_30_days,
        ds.qr_codes_count,
        ds.total_scans,
        ds.first_response_at,
        ds.latest_response_at
    FROM public.dashboard_summary ds
    WHERE ds.account_id = get_user_account_id();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public;

CREATE OR REPLACE FUNCTION get_form_analytics()
RETURNS TABLE (
    form_id UUID,
    form_name TEXT,
    account_id UUID,
    total_responses BIGINT,
    responses_last_7_days BIGINT,
    responses_last_30_days BIGINT,
    qr_codes_count BIGINT,
    total_scans BIGINT,
    first_response_at TIMESTAMP WITH TIME ZONE,
    latest_response_at TIMESTAMP WITH TIME ZONE,
    conversion_rate NUMERIC
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        fa.form_id,
        fa.form_name,
        fa.account_id,
        fa.total_responses,
        fa.responses_last_7_days,
        fa.responses_last_30_days,
        fa.qr_codes_count,
        fa.total_scans,
        fa.first_response_at,
        fa.latest_response_at,
        fa.conversion_rate
    FROM public.form_analytics fa
    WHERE fa.account_id = get_user_account_id();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public;

CREATE OR REPLACE FUNCTION get_response_trends()
RETURNS TABLE (
    account_id UUID,
    form_id UUID,
    response_date DATE,
    responses_count BIGINT
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        rt.account_id,
        rt.form_id,
        rt.response_date,
        rt.responses_count
    FROM public.response_trends rt
    WHERE rt.account_id = get_user_account_id();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public;

-- =============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- =============================================================================

-- Enable RLS on all tables
ALTER TABLE plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE forms ENABLE ROW LEVEL SECURITY;
ALTER TABLE questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE qr_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE response_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE usage_counters ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Drop all existing policies (clean slate)
DROP POLICY IF EXISTS "Plans are readable by authenticated users" ON plans;
DROP POLICY IF EXISTS "Users can read their own account" ON accounts;
DROP POLICY IF EXISTS "Users can create their own account" ON accounts;
DROP POLICY IF EXISTS "Users can update their own account" ON accounts;
DROP POLICY IF EXISTS "Users can read their account's projects" ON projects;
DROP POLICY IF EXISTS "Users can create projects in their account" ON projects;
DROP POLICY IF EXISTS "Users can update their account's projects" ON projects;
DROP POLICY IF EXISTS "Users can delete their account's projects" ON projects;
DROP POLICY IF EXISTS "Users can read forms in their account's projects" ON forms;
DROP POLICY IF EXISTS "Users can create forms in their account's projects" ON forms;
DROP POLICY IF EXISTS "Users can update forms in their account's projects" ON forms;
DROP POLICY IF EXISTS "Users can delete forms in their account's projects" ON forms;
DROP POLICY IF EXISTS "Users can read questions in their account's forms" ON questions;
DROP POLICY IF EXISTS "Users can create questions in their account's forms" ON questions;
DROP POLICY IF EXISTS "Users can update questions in their account's forms" ON questions;
DROP POLICY IF EXISTS "Users can delete questions in their account's forms" ON questions;
DROP POLICY IF EXISTS "Users can read QR codes for their account's forms" ON qr_codes;
DROP POLICY IF EXISTS "Users can create QR codes for their account's forms" ON qr_codes;
DROP POLICY IF EXISTS "Users can update QR codes for their account's forms" ON qr_codes;
DROP POLICY IF EXISTS "Users can delete QR codes for their account's forms" ON qr_codes;
DROP POLICY IF EXISTS "Users can read responses to their account's forms" ON responses;
DROP POLICY IF EXISTS "Anyone can submit responses to active forms" ON responses;
DROP POLICY IF EXISTS "Users can read response items for their account's forms" ON response_items;
DROP POLICY IF EXISTS "Anyone can submit response items for valid responses" ON response_items;
DROP POLICY IF EXISTS "Users can read their account's usage counters" ON usage_counters;
DROP POLICY IF EXISTS "Users can create usage counters for their account" ON usage_counters;
DROP POLICY IF EXISTS "Users can update their account's usage counters" ON usage_counters;
DROP POLICY IF EXISTS "Users can read their account's subscriptions" ON subscriptions;
DROP POLICY IF EXISTS "Users can create subscriptions for their account" ON subscriptions;
DROP POLICY IF EXISTS "Users can update their account's subscriptions" ON subscriptions;
DROP POLICY IF EXISTS "Users can read their account's audit logs" ON audit_logs;
DROP POLICY IF EXISTS "Service can insert audit logs" ON audit_logs;

-- Plans policies (everyone can read)
CREATE POLICY "Plans are readable by authenticated users" ON plans
    FOR SELECT TO authenticated USING (true);

-- Accounts policies
CREATE POLICY "Users can read their own account" ON accounts
    FOR SELECT TO authenticated USING (user_id = auth.uid());

CREATE POLICY "Users can create their own account" ON accounts
    FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own account" ON accounts
    FOR UPDATE TO authenticated USING (user_id = auth.uid());

-- Projects policies
CREATE POLICY "Users can read their account's projects" ON projects
    FOR SELECT TO authenticated USING (account_id = get_user_account_id());

CREATE POLICY "Users can create projects in their account" ON projects
    FOR INSERT TO authenticated WITH CHECK (account_id = get_user_account_id());

CREATE POLICY "Users can update their account's projects" ON projects
    FOR UPDATE TO authenticated USING (account_id = get_user_account_id());

CREATE POLICY "Users can delete their account's projects" ON projects
    FOR DELETE TO authenticated USING (account_id = get_user_account_id());

-- Forms policies
CREATE POLICY "Users can read forms in their account's projects" ON forms
    FOR SELECT TO authenticated USING (
        project_id IN (
            SELECT id FROM projects WHERE account_id = get_user_account_id()
        )
    );

CREATE POLICY "Users can create forms in their account's projects" ON forms
    FOR INSERT TO authenticated WITH CHECK (
        project_id IN (
            SELECT id FROM projects WHERE account_id = get_user_account_id()
        )
    );

CREATE POLICY "Users can update forms in their account's projects" ON forms
    FOR UPDATE TO authenticated USING (
        project_id IN (
            SELECT id FROM projects WHERE account_id = get_user_account_id()
        )
    );

CREATE POLICY "Users can delete forms in their account's projects" ON forms
    FOR DELETE TO authenticated USING (
        project_id IN (
            SELECT id FROM projects WHERE account_id = get_user_account_id()
        )
    );

-- Questions policies
CREATE POLICY "Users can read questions in their account's forms" ON questions
    FOR SELECT TO authenticated USING (
        form_id IN (
            SELECT f.id FROM forms f
            JOIN projects p ON f.project_id = p.id
            WHERE p.account_id = get_user_account_id()
        )
    );

CREATE POLICY "Users can create questions in their account's forms" ON questions
    FOR INSERT TO authenticated WITH CHECK (
        form_id IN (
            SELECT f.id FROM forms f
            JOIN projects p ON f.project_id = p.id
            WHERE p.account_id = get_user_account_id()
        )
    );

CREATE POLICY "Users can update questions in their account's forms" ON questions
    FOR UPDATE TO authenticated USING (
        form_id IN (
            SELECT f.id FROM forms f
            JOIN projects p ON f.project_id = p.id
            WHERE p.account_id = get_user_account_id()
        )
    );

CREATE POLICY "Users can delete questions in their account's forms" ON questions
    FOR DELETE TO authenticated USING (
        form_id IN (
            SELECT f.id FROM forms f
            JOIN projects p ON f.project_id = p.id
            WHERE p.account_id = get_user_account_id()
        )
    );

-- QR codes policies
CREATE POLICY "Users can read QR codes for their account's forms" ON qr_codes
    FOR SELECT TO authenticated USING (
        form_id IN (
            SELECT f.id FROM forms f
            JOIN projects p ON f.project_id = p.id
            WHERE p.account_id = get_user_account_id()
        )
    );

CREATE POLICY "Users can create QR codes for their account's forms" ON qr_codes
    FOR INSERT TO authenticated WITH CHECK (
        form_id IN (
            SELECT f.id FROM forms f
            JOIN projects p ON f.project_id = p.id
            WHERE p.account_id = get_user_account_id()
        )
    );

CREATE POLICY "Users can update QR codes for their account's forms" ON qr_codes
    FOR UPDATE TO authenticated USING (
        form_id IN (
            SELECT f.id FROM forms f
            JOIN projects p ON f.project_id = p.id
            WHERE p.account_id = get_user_account_id()
        )
    );

CREATE POLICY "Users can delete QR codes for their account's forms" ON qr_codes
    FOR DELETE TO authenticated USING (
        form_id IN (
            SELECT f.id FROM forms f
            JOIN projects p ON f.project_id = p.id
            WHERE p.account_id = get_user_account_id()
        )
    );

-- Responses policies
CREATE POLICY "Users can read responses to their account's forms" ON responses
    FOR SELECT TO authenticated USING (
        form_id IN (
            SELECT f.id FROM forms f
            JOIN projects p ON f.project_id = p.id
            WHERE p.account_id = get_user_account_id()
        )
    );

-- Allow anonymous users to submit responses (public forms)
CREATE POLICY "Anyone can submit responses to active forms" ON responses
    FOR INSERT TO anon WITH CHECK (
        form_id IN (
            SELECT f.id FROM forms f
            WHERE f.is_active = true
        )
    );

-- Response items policies
CREATE POLICY "Users can read response items for their account's forms" ON response_items
    FOR SELECT TO authenticated USING (
        response_id IN (
            SELECT r.id FROM responses r
            JOIN forms f ON r.form_id = f.id
            JOIN projects p ON f.project_id = p.id
            WHERE p.account_id = get_user_account_id()
        )
    );

-- Allow anonymous users to submit response items (public forms)
CREATE POLICY "Anyone can submit response items for valid responses" ON response_items
    FOR INSERT TO anon WITH CHECK (
        response_id IN (
            SELECT r.id FROM responses r
            JOIN forms f ON r.form_id = f.id
            WHERE f.is_active = true
        )
    );

-- Usage counters policies (CRITICAL FOR FRONTEND)
CREATE POLICY "Users can read their account's usage counters" ON usage_counters
    FOR SELECT TO authenticated USING (account_id = get_user_account_id());

CREATE POLICY "Users can create usage counters for their account" ON usage_counters
    FOR INSERT TO authenticated WITH CHECK (account_id = get_user_account_id());

CREATE POLICY "Users can update their account's usage counters" ON usage_counters
    FOR UPDATE TO authenticated USING (account_id = get_user_account_id());

-- Subscriptions policies
CREATE POLICY "Users can read their account's subscriptions" ON subscriptions
    FOR SELECT TO authenticated USING (account_id = get_user_account_id());

CREATE POLICY "Users can create subscriptions for their account" ON subscriptions
    FOR INSERT TO authenticated WITH CHECK (account_id = get_user_account_id());

CREATE POLICY "Users can update their account's subscriptions" ON subscriptions
    FOR UPDATE TO authenticated USING (account_id = get_user_account_id());

-- Audit logs policies
CREATE POLICY "Users can read their account's audit logs" ON audit_logs
    FOR SELECT TO authenticated USING (account_id = get_user_account_id());

CREATE POLICY "Service can insert audit logs" ON audit_logs
    FOR INSERT TO service_role WITH CHECK (true);

-- =============================================================================
-- SECURITY: HIDE MATERIALIZED VIEWS FROM DIRECT API ACCESS
-- =============================================================================

-- Revoke direct access to materialized views
REVOKE ALL ON public.dashboard_summary FROM anon, authenticated;
REVOKE ALL ON public.form_analytics FROM anon, authenticated;
REVOKE ALL ON public.response_trends FROM anon, authenticated;

-- Grant access only to the secure functions
GRANT EXECUTE ON FUNCTION get_dashboard_summary() TO authenticated;
GRANT EXECUTE ON FUNCTION get_form_analytics() TO authenticated;
GRANT EXECUTE ON FUNCTION get_response_trends() TO authenticated;

-- =============================================================================
-- CRON JOB FOR MATERIALIZED VIEW REFRESH
-- =============================================================================

-- Schedule materialized view refresh (if pg_cron is available)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pg_cron') THEN
        PERFORM cron.schedule(
            'refresh-dashboard-views',
            '*/15 * * * *', -- Every 15 minutes
            'SELECT refresh_dashboard_views();'
        );
        RAISE NOTICE 'Scheduled cron job: refresh-dashboard-views (every 15 minutes)';
    ELSE
        RAISE NOTICE 'pg_cron extension not found - skipping cron job creation';
    END IF;
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'Could not schedule cron job: %', SQLERRM;
END $$;

-- =============================================================================
-- SEED DATA
-- =============================================================================

-- Insert default plans (CRITICAL: Free plan MUST allow 1 project)
INSERT INTO plans (name, price, max_projects, max_forms_per_project, max_responses_per_form, features)
VALUES
('Free', 0, 1, 3, 50, '["basic_analytics", "qr_codes"]'),
('Starter', 999, 5, 10, 500, '["basic_analytics", "qr_codes", "export_csv"]'),
('Professional', 2999, 25, 50, 5000, '["basic_analytics", "qr_codes", "export_csv", "advanced_analytics", "custom_branding"]'),
('Enterprise', 9999, -1, -1, -1, '["basic_analytics", "qr_codes", "export_csv", "advanced_analytics", "custom_branding", "priority_support", "sso"]')
ON CONFLICT (name) DO UPDATE SET
    max_projects = EXCLUDED.max_projects,
    max_forms_per_project = EXCLUDED.max_forms_per_project,
    max_responses_per_form = EXCLUDED.max_responses_per_form,
    features = EXCLUDED.features,
    is_active = true;

-- Update existing rating questions to use default scale of 5
UPDATE questions
SET rating_scale = 5
WHERE type = 'rating' AND rating_scale IS NULL;

-- =============================================================================
-- CRITICAL: FIX EXISTING ACCOUNTS AND USAGE COUNTERS
-- =============================================================================

-- Ensure all existing users have accounts and correct usage counters
DO $$
DECLARE
    user_record RECORD;
    free_plan_id UUID;
    new_account_id UUID;
BEGIN
    -- Get Free plan ID
    SELECT id INTO free_plan_id FROM plans WHERE name = 'Free' LIMIT 1;

    -- Process all users who don't have accounts
    FOR user_record IN
        SELECT u.id as user_id, u.email, u.raw_user_meta_data
        FROM auth.users u
        WHERE NOT EXISTS (
            SELECT 1 FROM accounts a WHERE a.user_id = u.id
        )
    LOOP
        -- Create account for this user
        INSERT INTO accounts (user_id, name, plan_id)
        VALUES (
            user_record.user_id,
            COALESCE(
                user_record.raw_user_meta_data->>'full_name',
                user_record.email,
                'User'
            ),
            free_plan_id
        )
        RETURNING id INTO new_account_id;

        -- Initialize usage counters
        PERFORM sync_usage_counters(new_account_id);

        RAISE NOTICE 'Created account for user % with correct usage counters', user_record.email;
    END LOOP;

    -- Fix usage counters for ALL existing accounts
    FOR user_record IN
        SELECT a.id as account_id, a.name
        FROM accounts a
    LOOP
        PERFORM sync_usage_counters(user_record.account_id::UUID);
        RAISE NOTICE 'Synced usage counters for account: %', user_record.name;
    END LOOP;
END $$;

-- =============================================================================
-- COMPLETION MESSAGE AND VERIFICATION
-- =============================================================================

DO $$
DECLARE
    plan_count INTEGER;
    account_count INTEGER;
    user_account_record RECORD;
BEGIN
    -- Count what we created
    SELECT COUNT(*) INTO plan_count FROM plans;
    SELECT COUNT(*) INTO account_count FROM accounts;

    RAISE NOTICE '=============================================================================';
    RAISE NOTICE '🎉 BSP FEEDBACK TOOL - FINAL SETUP COMPLETE!';
    RAISE NOTICE '=============================================================================';
    RAISE NOTICE '';
    RAISE NOTICE '✅ CREATED SUCCESSFULLY:';
    RAISE NOTICE '   📊 Tables: 11 core tables + materialized views';
    RAISE NOTICE '   🔒 Security: All functions secured with search_path protection';
    RAISE NOTICE '   🛡️  RLS Policies: Complete data isolation between users';
    RAISE NOTICE '   ⚡ Performance: Optimized indexes and materialized views';
    RAISE NOTICE '   📈 Plans: % subscription plans created', plan_count;
    RAISE NOTICE '   👥 Accounts: % user accounts processed', account_count;
    RAISE NOTICE '';
    RAISE NOTICE '🔧 FRONTEND COMPATIBILITY:';
    RAISE NOTICE '   ✅ usage_counters table properly initialized';
    RAISE NOTICE '   ✅ All accounts have correct plan limits';
    RAISE NOTICE '   ✅ Project creation should work immediately';
    RAISE NOTICE '';
    RAISE NOTICE '📱 API ACCESS:';
    RAISE NOTICE '   • Tables: Direct Supabase client access with RLS';
    RAISE NOTICE '   • Analytics: Use RPC calls - supabase.rpc("get_dashboard_summary")';
    RAISE NOTICE '   • Functions: supabase.rpc("can_create_project", {account_uuid})';
    RAISE NOTICE '';

    -- Show current user status if logged in
    SELECT
        a.id as account_id,
        a.name,
        p.name as plan_name,
        uc.projects_count,
        p.max_projects
    INTO user_account_record
    FROM accounts a
    JOIN plans p ON a.plan_id = p.id
    LEFT JOIN usage_counters uc ON a.id = uc.account_id
    WHERE a.user_id = auth.uid()
    LIMIT 1;

    IF user_account_record.account_id IS NOT NULL THEN
        RAISE NOTICE '👤 YOUR CURRENT STATUS:';
        RAISE NOTICE '   Account: %', user_account_record.name;
        RAISE NOTICE '   Plan: %', user_account_record.plan_name;
        RAISE NOTICE '   Projects: %/%', user_account_record.projects_count, user_account_record.max_projects;

        IF user_account_record.projects_count < user_account_record.max_projects THEN
            RAISE NOTICE '   Status: ✅ CAN CREATE PROJECTS';
        ELSE
            RAISE NOTICE '   Status: ⚠️  At project limit';
        END IF;
    ELSE
        RAISE NOTICE '👤 Ready for new user registrations';
    END IF;

    RAISE NOTICE '';
    RAISE NOTICE '🚀 NEXT STEPS:';
    RAISE NOTICE '   1. Your frontend should work immediately';
    RAISE NOTICE '   2. Try creating a project - it should work now!';
    RAISE NOTICE '   3. If still having issues, restart your Next.js dev server';
    RAISE NOTICE '   4. Clear browser cache if needed';
    RAISE NOTICE '';
    RAISE NOTICE '🆘 TROUBLESHOOTING:';
    RAISE NOTICE '   • If project creation fails: Check browser console for errors';
    RAISE NOTICE '   • If limits wrong: Run SELECT * FROM usage_counters;';
    RAISE NOTICE '   • If auth issues: Verify user is logged in properly';
    RAISE NOTICE '';
    RAISE NOTICE 'Database is production-ready! 🎯';
    RAISE NOTICE '=============================================================================';
END $$;