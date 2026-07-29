-- Migration: Enterprise PSA Vendor Management Schema
-- Created: 2026-07-31

BEGIN;

-- 1. PSA Vendor Contracts
CREATE TABLE IF NOT EXISTS public.psa_vendor_contracts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  vendor_id UUID NOT NULL REFERENCES public.procurement_vendors(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  value NUMERIC(15,2) NOT NULL DEFAULT 0.00,
  contract_file_url TEXT,
  status VARCHAR(100) NOT NULL DEFAULT 'Active', -- Active, Expired, Terminated
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_vc_tenant ON public.psa_vendor_contracts(tenant_id);

-- Enable RLS
ALTER TABLE public.psa_vendor_contracts ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Tenant isolation for psa_vendor_contracts" ON public.psa_vendor_contracts;
CREATE POLICY "Tenant isolation for psa_vendor_contracts" ON public.psa_vendor_contracts
  USING (tenant_id = (SELECT tenant_id FROM public.users WHERE id = auth.uid()));


-- 2. PSA Vendor Performance Reviews
CREATE TABLE IF NOT EXISTS public.psa_vendor_performance (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  vendor_id UUID NOT NULL REFERENCES public.procurement_vendors(id) ON DELETE CASCADE,
  reviewed_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
  sla_score INTEGER NOT NULL DEFAULT 5, -- 1 to 5
  quality_score INTEGER NOT NULL DEFAULT 5, -- 1 to 5
  communication_score INTEGER NOT NULL DEFAULT 5, -- 1 to 5
  remarks TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_vp_perf_tenant ON public.psa_vendor_performance(tenant_id);

-- Enable RLS
ALTER TABLE public.psa_vendor_performance ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Tenant isolation for psa_vendor_performance" ON public.psa_vendor_performance;
CREATE POLICY "Tenant isolation for psa_vendor_performance" ON public.psa_vendor_performance
  USING (tenant_id = (SELECT tenant_id FROM public.users WHERE id = auth.uid()));

COMMIT;
