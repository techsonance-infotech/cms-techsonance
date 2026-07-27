-- Migration for Work From Home (WFH) Management Engine
-- Relational Foreign Key Schema linked to public.users & public.employees
-- Created: 2026-07-27

CREATE TABLE IF NOT EXISTS public.wfh_requests (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  employee_table_id BIGINT REFERENCES public.employees(id) ON DELETE CASCADE,
  request_code VARCHAR(50) NOT NULL,
  request_type VARCHAR(50) NOT NULL DEFAULT 'ad_hoc',
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  days_count INTEGER DEFAULT 1,
  reason TEXT NOT NULL,
  work_location_city VARCHAR(150) DEFAULT 'Remote Home Office',
  work_location_country VARCHAR(100) DEFAULT 'United States',
  geo_lat NUMERIC(10,6),
  geo_lng NUMERIC(10,6),
  ip_address VARCHAR(50),
  status VARCHAR(50) NOT NULL DEFAULT 'Pending',
  approver_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
  manager_comments TEXT,
  approved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.wfh_hybrid_schedules (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  hybrid_policy VARCHAR(100) DEFAULT 'Hybrid (3 Office / 2 WFH)',
  wfh_days JSONB DEFAULT '["Tuesday", "Thursday"]'::jsonb,
  office_days JSONB DEFAULT '["Monday", "Wednesday", "Friday"]'::jsonb,
  effective_from DATE NOT NULL,
  status VARCHAR(50) DEFAULT 'Active',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.wfh_equipment_assignments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  asset_name VARCHAR(150) NOT NULL,
  asset_type VARCHAR(100) NOT NULL,
  serial_number VARCHAR(100) NOT NULL,
  condition VARCHAR(50) DEFAULT 'Good',
  assigned_date DATE NOT NULL,
  status VARCHAR(50) DEFAULT 'Assigned',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.wfh_compliance_checklist (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  ergonomic_setup BOOLEAN DEFAULT true,
  high_speed_internet BOOLEAN DEFAULT true,
  private_workspace BOOLEAN DEFAULT true,
  vpn_configured BOOLEAN DEFAULT true,
  firewall_enabled BOOLEAN DEFAULT true,
  verified_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE public.wfh_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wfh_hybrid_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wfh_equipment_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wfh_compliance_checklist ENABLE ROW LEVEL SECURITY;

-- Idempotent Tenant Isolation Policies
DROP POLICY IF EXISTS "Tenant isolation for wfh_requests" ON public.wfh_requests;
CREATE POLICY "Tenant isolation for wfh_requests" ON public.wfh_requests
  USING (tenant_id = (SELECT tenant_id FROM public.users WHERE id = auth.uid()));

DROP POLICY IF EXISTS "Tenant isolation for wfh_hybrid_schedules" ON public.wfh_hybrid_schedules;
CREATE POLICY "Tenant isolation for wfh_hybrid_schedules" ON public.wfh_hybrid_schedules
  USING (tenant_id = (SELECT tenant_id FROM public.users WHERE id = auth.uid()));

DROP POLICY IF EXISTS "Tenant isolation for wfh_equipment_assignments" ON public.wfh_equipment_assignments;
CREATE POLICY "Tenant isolation for wfh_equipment_assignments" ON public.wfh_equipment_assignments
  USING (tenant_id = (SELECT tenant_id FROM public.users WHERE id = auth.uid()));

DROP POLICY IF EXISTS "Tenant isolation for wfh_compliance_checklist" ON public.wfh_compliance_checklist;
CREATE POLICY "Tenant isolation for wfh_compliance_checklist" ON public.wfh_compliance_checklist
  USING (tenant_id = (SELECT tenant_id FROM public.users WHERE id = auth.uid()));
