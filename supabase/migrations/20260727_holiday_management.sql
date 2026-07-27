-- Migration for Enterprise Holiday Management Engine
-- Relational Foreign Key Schema linked to public.tenants & public.users
-- Created: 2026-07-27

CREATE TABLE IF NOT EXISTS public.holiday_master (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  holiday_date DATE NOT NULL,
  holiday_type VARCHAR(100) NOT NULL DEFAULT 'global', 
  -- Types: 'global', 'country', 'state', 'branch', 'department', 'business_unit', 'festival', 'floating', 'restricted', 'regional', 'company'
  scope_target VARCHAR(150) DEFAULT 'Global',
  is_recurring BOOLEAN DEFAULT true,
  is_optional_rh BOOLEAN DEFAULT false,
  impact_level VARCHAR(50) DEFAULT 'High', -- 'High', 'Medium', 'Low'
  description TEXT,
  created_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.holiday_groups (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  group_name VARCHAR(150) NOT NULL,
  country VARCHAR(100) NOT NULL DEFAULT 'United States',
  branch_office VARCHAR(100),
  max_restricted_days INTEGER DEFAULT 2,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE public.holiday_master ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.holiday_groups ENABLE ROW LEVEL SECURITY;

-- Idempotent Tenant Isolation Policies
DROP POLICY IF EXISTS "Tenant isolation for holiday_master" ON public.holiday_master;
CREATE POLICY "Tenant isolation for holiday_master" ON public.holiday_master
  USING (tenant_id = (SELECT tenant_id FROM public.users WHERE id = auth.uid()));

DROP POLICY IF EXISTS "Tenant isolation for holiday_groups" ON public.holiday_groups;
CREATE POLICY "Tenant isolation for holiday_groups" ON public.holiday_groups
  USING (tenant_id = (SELECT tenant_id FROM public.users WHERE id = auth.uid()));
