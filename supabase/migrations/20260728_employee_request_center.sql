-- Migration for Centralized Employee Request Center
-- Relational Foreign Key Schema linked to public.tenants, public.users, and public.employees
-- Created: 2026-07-28

CREATE TABLE IF NOT EXISTS public.employee_requests (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  employee_table_id BIGINT REFERENCES public.employees(id) ON DELETE CASCADE,
  request_number VARCHAR(50) NOT NULL,
  category VARCHAR(100) NOT NULL,
  group_type VARCHAR(100) NOT NULL DEFAULT 'General & Travel',
  subject VARCHAR(255) NOT NULL,
  details TEXT NOT NULL,
  priority VARCHAR(50) NOT NULL DEFAULT 'Normal', -- 'Low', 'Normal', 'High', 'Urgent'
  status VARCHAR(50) NOT NULL DEFAULT 'Pending',   -- 'Pending', 'In_Progress', 'Approved', 'Rejected', 'Fulfilled'
  assigned_to UUID REFERENCES public.users(id) ON DELETE SET NULL,
  approver_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
  resolution_notes TEXT,
  attachment_url TEXT,
  sla_hours INTEGER DEFAULT 24,
  due_date TIMESTAMPTZ,
  approved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.employee_request_categories (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
  group_type VARCHAR(100) NOT NULL,
  sla_hours INTEGER DEFAULT 24,
  requires_manager_approval BOOLEAN DEFAULT true,
  requires_hr_approval BOOLEAN DEFAULT true,
  icon_name VARCHAR(50) DEFAULT 'FileText',
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE public.employee_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.employee_request_categories ENABLE ROW LEVEL SECURITY;

-- Idempotent Tenant Isolation Policies
DROP POLICY IF EXISTS "Tenant isolation for employee_requests" ON public.employee_requests;
CREATE POLICY "Tenant isolation for employee_requests" ON public.employee_requests
  USING (tenant_id = (SELECT tenant_id FROM public.users WHERE id = auth.uid()));

DROP POLICY IF EXISTS "Tenant isolation for employee_request_categories" ON public.employee_request_categories;
CREATE POLICY "Tenant isolation for employee_request_categories" ON public.employee_request_categories
  USING (tenant_id = (SELECT tenant_id FROM public.users WHERE id = auth.uid()));
