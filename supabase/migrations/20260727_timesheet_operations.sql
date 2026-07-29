-- Migration for Timesheet Operations Engine
-- Relational Foreign Key Schema linked to public.users & public.employees & public.projects
-- Created: 2026-07-27

CREATE TABLE IF NOT EXISTS public.timesheet_periods (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  period_code VARCHAR(50) NOT NULL,
  period_type VARCHAR(50) NOT NULL DEFAULT 'weekly', -- 'weekly', 'biweekly', 'monthly'
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  is_locked BOOLEAN DEFAULT false,
  locked_at TIMESTAMPTZ,
  locked_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.timesheet_entries (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  employee_table_id BIGINT REFERENCES public.employees(id) ON DELETE CASCADE,
  project_id BIGINT,
  project_name VARCHAR(255) NOT NULL DEFAULT 'Internal Operations',
  task_name VARCHAR(255) NOT NULL,
  activity_category VARCHAR(100) DEFAULT 'Development',
  entry_date DATE NOT NULL,
  
  -- Hours Breakdown
  billable_hours NUMERIC(5,2) NOT NULL DEFAULT 0.00,
  non_billable_hours NUMERIC(5,2) NOT NULL DEFAULT 0.00,
  overtime_hours NUMERIC(5,2) NOT NULL DEFAULT 0.00,
  billing_rate NUMERIC(10,2) DEFAULT 0.00,
  
  -- Workflow & Compliance
  status VARCHAR(50) NOT NULL DEFAULT 'Submitted', -- 'Draft', 'Submitted', 'Approved', 'Rejected', 'Correction_Requested'
  is_late_submission BOOLEAN DEFAULT false,
  late_submission_reason TEXT,
  correction_notes TEXT,
  approver_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
  approved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.timesheet_approvals (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  timesheet_entry_id UUID NOT NULL REFERENCES public.timesheet_entries(id) ON DELETE CASCADE,
  actor_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
  action_taken VARCHAR(50) NOT NULL, -- 'Approved', 'Rejected', 'Bulk_Approved', 'Correction_Requested'
  comments TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE public.timesheet_periods ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.timesheet_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.timesheet_approvals ENABLE ROW LEVEL SECURITY;

-- Idempotent Tenant Isolation Policies
DROP POLICY IF EXISTS "Tenant isolation for timesheet_periods" ON public.timesheet_periods;
CREATE POLICY "Tenant isolation for timesheet_periods" ON public.timesheet_periods
  USING (tenant_id = (SELECT tenant_id FROM public.users WHERE id = auth.uid()));

DROP POLICY IF EXISTS "Tenant isolation for timesheet_entries" ON public.timesheet_entries;
CREATE POLICY "Tenant isolation for timesheet_entries" ON public.timesheet_entries
  USING (tenant_id = (SELECT tenant_id FROM public.users WHERE id = auth.uid()));

DROP POLICY IF EXISTS "Tenant isolation for timesheet_approvals" ON public.timesheet_approvals;
CREATE POLICY "Tenant isolation for timesheet_approvals" ON public.timesheet_approvals
  USING (tenant_id = (SELECT tenant_id FROM public.users WHERE id = auth.uid()));
