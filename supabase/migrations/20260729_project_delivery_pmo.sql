-- Migration: Project Delivery & PMO Schema
-- Created: 2026-07-29

BEGIN;

-- 1. Extend tasks table
ALTER TABLE public.tasks ADD COLUMN IF NOT EXISTS parent_id BIGINT REFERENCES public.tasks(id) ON DELETE SET NULL;
ALTER TABLE public.tasks ADD COLUMN IF NOT EXISTS estimated_hours NUMERIC(8,2) DEFAULT 0.00;
ALTER TABLE public.tasks ADD COLUMN IF NOT EXISTS logged_hours NUMERIC(8,2) DEFAULT 0.00;
ALTER TABLE public.tasks ADD COLUMN IF NOT EXISTS task_type VARCHAR(50) DEFAULT 'task';
ALTER TABLE public.tasks ADD COLUMN IF NOT EXISTS severity VARCHAR(50) DEFAULT 'medium';
ALTER TABLE public.tasks ADD COLUMN IF NOT EXISTS checklists JSONB DEFAULT '[]'::jsonb;
ALTER TABLE public.tasks ADD COLUMN IF NOT EXISTS epic_id BIGINT REFERENCES public.tasks(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_tasks_parent_id ON public.tasks(parent_id);
CREATE INDEX IF NOT EXISTS idx_tasks_epic_id ON public.tasks(epic_id);

-- 2. Staffing Requests table
CREATE TABLE IF NOT EXISTS public.staffing_requests (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  project_id BIGINT REFERENCES public.projects(id) ON DELETE CASCADE,
  project_name VARCHAR(255),
  role_requested VARCHAR(255) NOT NULL,
  skills_required TEXT,
  seniority VARCHAR(100) DEFAULT 'Senior',
  duration VARCHAR(100) DEFAULT '6 months',
  status VARCHAR(50) DEFAULT 'Pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- RLS policies
ALTER TABLE public.staffing_requests ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Tenant isolation for staffing_requests" ON public.staffing_requests;
CREATE POLICY "Tenant isolation for staffing_requests" ON public.staffing_requests
  USING (tenant_id = (SELECT tenant_id FROM public.users WHERE id = auth.uid()));

-- 3. Project Risks & Issues table
CREATE TABLE IF NOT EXISTS public.project_risks_issues (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  project_id BIGINT REFERENCES public.projects(id) ON DELETE CASCADE,
  type VARCHAR(50) NOT NULL, -- 'risk', 'issue'
  title VARCHAR(255) NOT NULL,
  description TEXT,
  impact VARCHAR(50) DEFAULT 'Medium',
  probability VARCHAR(50) DEFAULT 'Medium',
  mitigation TEXT,
  severity VARCHAR(50) DEFAULT 'medium', -- 'low', 'medium', 'high', 'critical'
  status VARCHAR(50) DEFAULT 'open', -- 'open', 'resolved', 'mitigated'
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- RLS policies
ALTER TABLE public.project_risks_issues ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Tenant isolation for project_risks_issues" ON public.project_risks_issues;
CREATE POLICY "Tenant isolation for project_risks_issues" ON public.project_risks_issues
  USING (tenant_id = (SELECT tenant_id FROM public.users WHERE id = auth.uid()));

-- 4. PSA Contracts table
CREATE TABLE IF NOT EXISTS public.psa_contracts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  project_id BIGINT REFERENCES public.projects(id) ON DELETE CASCADE,
  sow_details TEXT,
  billing_model VARCHAR(50) DEFAULT 'fixed_cost', -- 'fixed_cost', 'time_and_materials', 'retainer'
  planned_revenue NUMERIC(15,4) DEFAULT 0.00,
  actual_revenue NUMERIC(15,4) DEFAULT 0.00,
  planned_cost NUMERIC(15,4) DEFAULT 0.00,
  actual_cost NUMERIC(15,4) DEFAULT 0.00,
  margin_percentage NUMERIC(5,2) DEFAULT 0.00,
  revenue_leakage NUMERIC(15,4) DEFAULT 0.00,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- RLS policies
ALTER TABLE public.psa_contracts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Tenant isolation for psa_contracts" ON public.psa_contracts;
CREATE POLICY "Tenant isolation for psa_contracts" ON public.psa_contracts
  USING (tenant_id = (SELECT tenant_id FROM public.users WHERE id = auth.uid()));

COMMIT;
