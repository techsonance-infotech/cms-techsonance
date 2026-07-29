-- Migration for Enterprise Compliance Operations
-- Relational Foreign Key Schema linked to public.tenants, public.users, and public.employees
-- Created: 2026-07-28

CREATE TABLE IF NOT EXISTS public.compliance_items (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  employee_table_id BIGINT REFERENCES public.employees(id) ON DELETE CASCADE,
  category VARCHAR(100) NOT NULL,
  item_name VARCHAR(255) NOT NULL,
  compliance_status VARCHAR(50) NOT NULL DEFAULT 'Compliant', -- 'Compliant', 'Pending', 'Non_Compliant', 'Expiring_Soon'
  due_date TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  verification_notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.compliance_audit_findings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  finding_code VARCHAR(50) NOT NULL,
  category VARCHAR(100) NOT NULL,
  severity VARCHAR(50) NOT NULL DEFAULT 'Medium', -- 'Low', 'Medium', 'High', 'Critical'
  description TEXT NOT NULL,
  status VARCHAR(50) NOT NULL DEFAULT 'Open',       -- 'Open', 'In_Review', 'Closed'
  corrective_action_plan TEXT,
  assigned_to UUID REFERENCES public.users(id) ON DELETE SET NULL,
  due_date TIMESTAMPTZ,
  resolved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE public.compliance_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.compliance_audit_findings ENABLE ROW LEVEL SECURITY;

-- Idempotent Tenant Isolation Policies
DROP POLICY IF EXISTS "Tenant isolation for compliance_items" ON public.compliance_items;
CREATE POLICY "Tenant isolation for compliance_items" ON public.compliance_items
  USING (tenant_id = (SELECT tenant_id FROM public.users WHERE id = auth.uid()));

DROP POLICY IF EXISTS "Tenant isolation for compliance_audit_findings" ON public.compliance_audit_findings;
CREATE POLICY "Tenant isolation for compliance_audit_findings" ON public.compliance_audit_findings
  USING (tenant_id = (SELECT tenant_id FROM public.users WHERE id = auth.uid()));
