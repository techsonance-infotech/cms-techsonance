-- ============================================================
-- SQL Migration: Configurable Offboarding Workflows & Audit Logs
-- ============================================================

CREATE TABLE IF NOT EXISTS public.offboarding_workflows (
    id SERIAL PRIMARY KEY,
    tenant_id uuid NOT NULL,
    employee_id integer NOT NULL,
    status text DEFAULT 'draft' NOT NULL, -- draft, active, under_review, approved, rejected, completed
    current_stage text DEFAULT 'Separation Request' NOT NULL,
    approval_chain jsonb DEFAULT '[]'::jsonb, -- custom approver hierarchy definitions
    approval_history jsonb DEFAULT '[]'::jsonb,
    draft_data jsonb DEFAULT '{}'::jsonb,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE IF NOT EXISTS public.offboarding_events (
    id SERIAL PRIMARY KEY,
    tenant_id uuid NOT NULL,
    workflow_id integer REFERENCES public.offboarding_workflows(id) ON DELETE CASCADE,
    event_type text NOT NULL, -- SeparationRequested, ResignationSubmitted, ResignationApproved, ITDeprovisioned, OffboardingCompleted
    payload jsonb DEFAULT '{}'::jsonb,
    processed_status text DEFAULT 'pending' NOT NULL, -- pending, processed, failed
    retry_count integer DEFAULT 0 NOT NULL,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE IF NOT EXISTS public.offboarding_audit_logs (
    id SERIAL PRIMARY KEY,
    tenant_id uuid NOT NULL,
    workflow_id integer,
    employee_id integer,
    stage_name text NOT NULL,
    action text NOT NULL,
    previous_value text,
    new_value text,
    performed_by text NOT NULL,
    ip_address text,
    device_info text,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS and Tenant Isolation
ALTER TABLE public.offboarding_workflows ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.offboarding_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.offboarding_audit_logs ENABLE ROW LEVEL SECURITY;

-- Drop Policies if exist and recreate
DROP POLICY IF EXISTS tenant_isolation_policy ON public.offboarding_workflows;
DROP POLICY IF EXISTS tenant_isolation_policy ON public.offboarding_events;
DROP POLICY IF EXISTS tenant_isolation_policy ON public.offboarding_audit_logs;

CREATE POLICY tenant_isolation_policy ON public.offboarding_workflows
    FOR ALL USING (tenant_id = public.current_tenant_id()) WITH CHECK (tenant_id = public.current_tenant_id());

CREATE POLICY tenant_isolation_policy ON public.offboarding_events
    FOR ALL USING (tenant_id = public.current_tenant_id()) WITH CHECK (tenant_id = public.current_tenant_id());

CREATE POLICY tenant_isolation_policy ON public.offboarding_audit_logs
    FOR ALL USING (tenant_id = public.current_tenant_id()) WITH CHECK (tenant_id = public.current_tenant_id());
