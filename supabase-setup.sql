-- =============================================================================
-- BSP Feedback Tool - Complete Database Setup Script
-- =============================================================================
-- Run this script in your Supabase SQL Editor to set up the complete database
-- =============================================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create custom types (skip if already exists)
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

-- Usage counters for plan limits
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

-- =============================================================================
-- INDEXES FOR PERFORMANCE
-- =============================================================================

-- Foreign key indexes
CREATE INDEX IF NOT EXISTS idx_accounts_user_id ON accounts(user_id);
CREATE INDEX IF NOT EXISTS idx_projects_account_id ON projects(account_id);
CREATE INDEX IF NOT EXISTS idx_forms_project_id ON forms(project_id);
CREATE INDEX IF NOT EXISTS idx_questions_form_id ON questions(form_id);
CREATE INDEX IF NOT EXISTS idx_qr_codes_form_id ON qr_codes(form_id);
CREATE INDEX IF NOT EXISTS idx_responses_form_id ON responses(form_id);
CREATE INDEX IF NOT EXISTS idx_response_items_response_id ON response_items(response_id);
CREATE INDEX IF NOT EXISTS idx_response_items_question_id ON response_items(question_id);

-- Query optimization indexes
CREATE INDEX IF NOT EXISTS idx_qr_codes_short_url ON qr_codes(short_url);
CREATE INDEX IF NOT EXISTS idx_questions_order ON questions(form_id, order_index);
CREATE INDEX IF NOT EXISTS idx_responses_submitted_at ON responses(submitted_at);
CREATE INDEX IF NOT EXISTS idx_usage_counters_account_period ON usage_counters(account_id, period_start);

-- =============================================================================
-- FUNCTIONS AND TRIGGERS
-- =============================================================================

-- Function to update updated_at column
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply updated_at triggers to relevant tables (skip if they exist)
DROP TRIGGER IF EXISTS update_accounts_updated_at ON accounts;
CREATE TRIGGER update_accounts_updated_at BEFORE UPDATE ON accounts FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_projects_updated_at ON projects;
CREATE TRIGGER update_projects_updated_at BEFORE UPDATE ON projects FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_forms_updated_at ON forms;
CREATE TRIGGER update_forms_updated_at BEFORE UPDATE ON forms FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_usage_counters_updated_at ON usage_counters;
CREATE TRIGGER update_usage_counters_updated_at BEFORE UPDATE ON usage_counters FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to create account automatically when user signs up
CREATE OR REPLACE FUNCTION create_user_account()
RETURNS TRIGGER AS $$
DECLARE
    free_plan_id UUID;
BEGIN
    -- Get the Free plan ID
    SELECT id INTO free_plan_id FROM plans WHERE name = 'Free' LIMIT 1;

    -- Create account for new user
    INSERT INTO accounts (user_id, name, plan_id)
    VALUES (
        NEW.id,
        COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
        free_plan_id
    );

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create account on user creation (replace if exists)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION create_user_account();

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

        SELECT EXISTS(SELECT 1 FROM qr_codes WHERE short_url = result) INTO url_exists;
    END LOOP;

    RETURN result;
END;
$$ LANGUAGE plpgsql;

-- =============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- =============================================================================

-- Enable RLS on all tables (safe to run multiple times)
ALTER TABLE plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE forms ENABLE ROW LEVEL SECURITY;
ALTER TABLE questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE qr_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE response_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE usage_counters ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist (to avoid conflicts)
DROP POLICY IF EXISTS "Anyone can read plans" ON plans;
DROP POLICY IF EXISTS "Users can read own account" ON accounts;
DROP POLICY IF EXISTS "Users can update own account" ON accounts;
DROP POLICY IF EXISTS "Users can manage own projects" ON projects;
DROP POLICY IF EXISTS "Users can manage own forms" ON forms;
DROP POLICY IF EXISTS "Users can manage own questions" ON questions;
DROP POLICY IF EXISTS "Users can manage own qr codes" ON qr_codes;
DROP POLICY IF EXISTS "Users can read own responses" ON responses;
DROP POLICY IF EXISTS "Anyone can submit responses" ON responses;
DROP POLICY IF EXISTS "Users can read own response items" ON response_items;
DROP POLICY IF EXISTS "Anyone can submit response items" ON response_items;
DROP POLICY IF EXISTS "Users can manage own usage counters" ON usage_counters;

-- Helper function to get user's account ID
CREATE OR REPLACE FUNCTION get_user_account_id()
RETURNS UUID AS $$
BEGIN
    RETURN (
        SELECT id FROM accounts
        WHERE user_id = auth.uid()
        LIMIT 1
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Plans policies (everyone can read)
CREATE POLICY "Anyone can read plans" ON plans
    FOR SELECT USING (true);

-- Accounts policies
CREATE POLICY "Users can read own account" ON accounts
    FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can update own account" ON accounts
    FOR UPDATE USING (user_id = auth.uid());

-- Projects policies
CREATE POLICY "Users can manage own projects" ON projects
    FOR ALL USING (account_id = get_user_account_id());

-- Forms policies
CREATE POLICY "Users can manage own forms" ON forms
    FOR ALL USING (
        project_id IN (
            SELECT id FROM projects WHERE account_id = get_user_account_id()
        )
    );

-- Questions policies
CREATE POLICY "Users can manage own questions" ON questions
    FOR ALL USING (
        form_id IN (
            SELECT f.id FROM forms f
            JOIN projects p ON f.project_id = p.id
            WHERE p.account_id = get_user_account_id()
        )
    );

-- QR codes policies
CREATE POLICY "Users can manage own qr codes" ON qr_codes
    FOR ALL USING (
        form_id IN (
            SELECT f.id FROM forms f
            JOIN projects p ON f.project_id = p.id
            WHERE p.account_id = get_user_account_id()
        )
    );

-- Responses policies (users can read their own, anyone can submit)
CREATE POLICY "Users can read own responses" ON responses
    FOR SELECT USING (
        form_id IN (
            SELECT f.id FROM forms f
            JOIN projects p ON f.project_id = p.id
            WHERE p.account_id = get_user_account_id()
        )
    );

CREATE POLICY "Anyone can submit responses" ON responses
    FOR INSERT WITH CHECK (
        form_id IN (
            SELECT id FROM forms WHERE is_active = true
        )
    );

-- Response items policies
CREATE POLICY "Users can read own response items" ON response_items
    FOR SELECT USING (
        response_id IN (
            SELECT r.id FROM responses r
            JOIN forms f ON r.form_id = f.id
            JOIN projects p ON f.project_id = p.id
            WHERE p.account_id = get_user_account_id()
        )
    );

CREATE POLICY "Anyone can submit response items" ON response_items
    FOR INSERT WITH CHECK (
        response_id IN (
            SELECT r.id FROM responses r
            JOIN forms f ON r.form_id = f.id
            WHERE f.is_active = true
        )
    );

-- Usage counters policies
CREATE POLICY "Users can manage own usage counters" ON usage_counters
    FOR ALL USING (account_id = get_user_account_id());

-- =============================================================================
-- MATERIALIZED VIEW FOR DASHBOARD PERFORMANCE
-- =============================================================================

-- Drop and recreate materialized view (to handle changes)
DROP MATERIALIZED VIEW IF EXISTS dashboard_summary;
CREATE MATERIALIZED VIEW dashboard_summary AS
SELECT
    p.account_id,
    p.id as project_id,
    p.name as project_name,
    COUNT(DISTINCT f.id) as forms_count,
    COUNT(DISTINCT r.id) as total_responses,
    COUNT(DISTINCT CASE WHEN r.submitted_at >= NOW() - INTERVAL '7 days' THEN r.id END) as responses_last_7_days,
    COUNT(DISTINCT CASE WHEN r.submitted_at >= NOW() - INTERVAL '30 days' THEN r.id END) as responses_last_30_days,
    COUNT(DISTINCT qr.id) as qr_codes_count,
    COALESCE(SUM(qr.scan_count), 0) as total_scans,
    MIN(r.submitted_at) as first_response_at,
    MAX(r.submitted_at) as latest_response_at
FROM projects p
LEFT JOIN forms f ON p.id = f.project_id
LEFT JOIN qr_codes qr ON f.id = qr.form_id
LEFT JOIN responses r ON f.id = r.form_id
GROUP BY p.account_id, p.id, p.name;

-- Create index on materialized view
CREATE INDEX IF NOT EXISTS idx_dashboard_summary_account_id ON dashboard_summary(account_id);

-- Function to refresh materialized views
CREATE OR REPLACE FUNCTION refresh_dashboard_views()
RETURNS VOID AS $$
BEGIN
    REFRESH MATERIALIZED VIEW CONCURRENTLY dashboard_summary;
END;
$$ LANGUAGE plpgsql;

-- =============================================================================
-- SEED DATA
-- =============================================================================

-- Insert default plans (skip if they already exist)
INSERT INTO plans (name, price, max_projects, max_forms_per_project, max_responses_per_form, features)
VALUES
('Free', 0, 1, 3, 50, '["basic_analytics", "qr_codes"]'),
('Starter', 999, 5, 10, 500, '["basic_analytics", "qr_codes", "export_csv"]'),
('Professional', 2999, 25, 50, 5000, '["basic_analytics", "qr_codes", "export_csv", "advanced_analytics", "custom_branding"]'),
('Enterprise', 9999, -1, -1, -1, '["basic_analytics", "qr_codes", "export_csv", "advanced_analytics", "custom_branding", "priority_support", "sso"]')
ON CONFLICT (name) DO NOTHING;

-- =============================================================================
-- COMPLETION MESSAGE
-- =============================================================================

-- Log completion
DO $$
BEGIN
    RAISE NOTICE 'BSP Feedback Tool database setup completed successfully!';
    RAISE NOTICE 'Created tables: plans, accounts, projects, forms, questions, qr_codes, responses, response_items, usage_counters';
    RAISE NOTICE 'Created policies: Row Level Security enabled for all tables';
    RAISE NOTICE 'Created triggers: Auto account creation, updated_at timestamps';
    RAISE NOTICE 'Created materialized view: dashboard_summary';
    RAISE NOTICE 'Inserted seed data: 4 subscription plans';
    RAISE NOTICE '';
    RAISE NOTICE 'Next steps:';
    RAISE NOTICE '1. Your Next.js app should now work without authentication errors';
    RAISE NOTICE '2. Users will automatically get a Free plan account when they sign up';
    RAISE NOTICE '3. You can create projects, forms, and start collecting responses';
END $$;