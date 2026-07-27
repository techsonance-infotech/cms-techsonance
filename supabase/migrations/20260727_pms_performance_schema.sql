-- Supabase Migration: Enterprise Performance Management System (PMS) Schema
-- Created: 2026-07-27

-- Acquire locks in a consistent order at the start to prevent concurrent read/write deadlock
LOCK TABLE public.performance_reviews IN ACCESS EXCLUSIVE MODE;

-- 1. Create pms_cycles table
CREATE TABLE IF NOT EXISTS public.pms_cycles (
    id SERIAL PRIMARY KEY,
    tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    title text NOT NULL,
    cycle_type text DEFAULT 'annual' NOT NULL, -- quarterly, half_yearly, annual, probation, confirmation
    start_date date NOT NULL,
    end_date date NOT NULL,
    status text DEFAULT 'draft' NOT NULL, -- draft, goal_setting, self_assessment, peer_review, manager_review, calibration, closed
    weightage_goals integer DEFAULT 50, -- Percentage out of 100
    weightage_competencies integer DEFAULT 50, -- Percentage out of 100
    created_at timestamptz DEFAULT now() NOT NULL
);

-- 2. Create pms_goals table (Cascading OKRs & KPIs)
CREATE TABLE IF NOT EXISTS public.pms_goals (
    id SERIAL PRIMARY KEY,
    tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    employee_id integer NOT NULL, -- references public.employees(id)
    cycle_id integer REFERENCES public.pms_cycles(id) ON DELETE SET NULL,
    title text NOT NULL,
    description text,
    goal_type text DEFAULT 'individual' NOT NULL, -- organizational, department, team, individual
    parent_goal_id integer REFERENCES public.pms_goals(id) ON DELETE SET NULL,
    weightage integer DEFAULT 10, -- out of 100
    target_value numeric(12,2) DEFAULT 100.00,
    current_value numeric(12,2) DEFAULT 0.00,
    metric_unit text DEFAULT '%',
    status text DEFAULT 'pending' NOT NULL, -- pending, approved, in_progress, achieved, missed
    created_at timestamptz DEFAULT now() NOT NULL
);

-- 3. Create pms_feedback table (Continuous 360 feedback)
CREATE TABLE IF NOT EXISTS public.pms_feedback (
    id SERIAL PRIMARY KEY,
    tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    employee_id integer NOT NULL, -- references public.employees(id)
    reviewer_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE, -- User UUID giving feedback
    feedback_text text NOT NULL,
    rating integer CHECK (rating >= 1 AND rating <= 5),
    badge text, -- e.g. Team Player, Innovation Star, Customer Champion
    visibility text DEFAULT 'public' NOT NULL, -- public, manager_only, confidential
    created_at timestamptz DEFAULT now() NOT NULL
);

-- 4. Create pms_competencies table
CREATE TABLE IF NOT EXISTS public.pms_competencies (
    id SERIAL PRIMARY KEY,
    tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    employee_id integer NOT NULL, -- references public.employees(id)
    cycle_id integer REFERENCES public.pms_cycles(id) ON DELETE SET NULL,
    competency_name text NOT NULL,
    expected_rating integer DEFAULT 3,
    actual_rating integer,
    justification text,
    created_at timestamptz DEFAULT now() NOT NULL
);

-- 5. Create pms_calibration table
CREATE TABLE IF NOT EXISTS public.pms_calibration (
    id SERIAL PRIMARY KEY,
    tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    employee_id integer NOT NULL, -- references public.employees(id)
    cycle_id integer REFERENCES public.pms_cycles(id) ON DELETE CASCADE,
    original_rating numeric(3,2) NOT NULL,
    calibrated_rating numeric(3,2) NOT NULL,
    justification text NOT NULL,
    approved_by uuid REFERENCES auth.users(id),
    created_at timestamptz DEFAULT now() NOT NULL
);

-- 6. Create pms_career_plans table (Individual Development Plan IDP)
CREATE TABLE IF NOT EXISTS public.pms_career_plans (
    id SERIAL PRIMARY KEY,
    tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    employee_id integer NOT NULL, -- references public.employees(id)
    target_role text NOT NULL,
    long_term_aspirations text,
    action_plan jsonb, -- Array of actions
    status text DEFAULT 'in_progress' NOT NULL, -- in_progress, achieved, deferred
    created_at timestamptz DEFAULT now() NOT NULL
);

-- 7. Create pms_succession table
CREATE TABLE IF NOT EXISTS public.pms_succession (
    id SERIAL PRIMARY KEY,
    tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    position_name text NOT NULL, -- Key leadership position
    primary_successor_id integer, -- references public.employees(id)
    secondary_successor_id integer, -- references public.employees(id)
    readiness_timeline text DEFAULT 'ready_1_2_years' NOT NULL, -- immediate, ready_1_2_years, ready_3_5_years
    risk_mitigation text,
    created_at timestamptz DEFAULT now() NOT NULL
);

-- 8. Create pms_pips table (Performance Improvement Plans)
CREATE TABLE IF NOT EXISTS public.pms_pips (
    id SERIAL PRIMARY KEY,
    tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    employee_id integer NOT NULL, -- references public.employees(id)
    start_date date NOT NULL,
    end_date date NOT NULL,
    objectives jsonb NOT NULL, -- Array of improvement objectives
    review_milestones jsonb, -- Array of progress check-ins
    status text DEFAULT 'active' NOT NULL, -- active, completed_successfully, terminated
    created_at timestamptz DEFAULT now() NOT NULL
);

-- 9. Create pms_audit_logs table
CREATE TABLE IF NOT EXISTS public.pms_audit_logs (
    id SERIAL PRIMARY KEY,
    tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    performed_by uuid NOT NULL,
    action text NOT NULL,
    details jsonb,
    created_at timestamptz DEFAULT now() NOT NULL
);

-- 10. Enable RLS on all newly created tables
ALTER TABLE public.pms_cycles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pms_goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pms_feedback ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pms_competencies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pms_calibration ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pms_career_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pms_succession ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pms_pips ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pms_audit_logs ENABLE ROW LEVEL SECURITY;

-- 11. Implement RLS tenant isolation policies
CREATE POLICY tenant_isolation_policy ON public.pms_cycles
    FOR ALL USING (tenant_id = ((auth.jwt() ->> 'tenant_id')::uuid));

CREATE POLICY tenant_isolation_policy ON public.pms_goals
    FOR ALL USING (tenant_id = ((auth.jwt() ->> 'tenant_id')::uuid));

CREATE POLICY tenant_isolation_policy ON public.pms_feedback
    FOR ALL USING (tenant_id = ((auth.jwt() ->> 'tenant_id')::uuid));

CREATE POLICY tenant_isolation_policy ON public.pms_competencies
    FOR ALL USING (tenant_id = ((auth.jwt() ->> 'tenant_id')::uuid));

CREATE POLICY tenant_isolation_policy ON public.pms_calibration
    FOR ALL USING (tenant_id = ((auth.jwt() ->> 'tenant_id')::uuid));

CREATE POLICY tenant_isolation_policy ON public.pms_career_plans
    FOR ALL USING (tenant_id = ((auth.jwt() ->> 'tenant_id')::uuid));

CREATE POLICY tenant_isolation_policy ON public.pms_succession
    FOR ALL USING (tenant_id = ((auth.jwt() ->> 'tenant_id')::uuid));

CREATE POLICY tenant_isolation_policy ON public.pms_pips
    FOR ALL USING (tenant_id = ((auth.jwt() ->> 'tenant_id')::uuid));

CREATE POLICY tenant_isolation_policy ON public.pms_audit_logs
    FOR ALL USING (tenant_id = ((auth.jwt() ->> 'tenant_id')::uuid));
