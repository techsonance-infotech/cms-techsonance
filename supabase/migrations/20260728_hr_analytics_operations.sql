-- Migration for Enterprise HR Analytics & Operational Intelligence
-- Relational Foreign Key Schema linked to public.tenants
-- Created: 2026-07-28

CREATE TABLE IF NOT EXISTS public.hr_analytics_snapshots (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  snapshot_date DATE NOT NULL DEFAULT CURRENT_DATE,
  attendance_rate_percent DECIMAL(5, 2) DEFAULT 98.40,
  leave_utilization_percent DECIMAL(5, 2) DEFAULT 12.50,
  shift_utilization_percent DECIMAL(5, 2) DEFAULT 96.20,
  wfh_percentage DECIMAL(5, 2) DEFAULT 28.50,
  approval_sla_hours DECIMAL(5, 2) DEFAULT 4.20,
  ticket_sla_hours DECIMAL(5, 2) DEFAULT 14.00,
  monthly_expense_total DECIMAL(12, 2) DEFAULT 145000.00,
  compliance_score_percent DECIMAL(5, 2) DEFAULT 97.80,
  manager_responsiveness_index DECIMAL(5, 2) DEFAULT 94.50,
  employee_satisfaction_csat DECIMAL(3, 2) DEFAULT 4.80,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE public.hr_analytics_snapshots ENABLE ROW LEVEL SECURITY;

-- Idempotent Tenant Isolation Policy
DROP POLICY IF EXISTS "Tenant isolation for hr_analytics_snapshots" ON public.hr_analytics_snapshots;
CREATE POLICY "Tenant isolation for hr_analytics_snapshots" ON public.hr_analytics_snapshots
  USING (tenant_id = (SELECT tenant_id FROM public.users WHERE id = auth.uid()));
