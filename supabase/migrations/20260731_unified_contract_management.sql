-- Migration: Enterprise Unified Contract Management Schema
-- Created: 2026-07-31

BEGIN;

-- 1. Unified Contracts Table
CREATE TABLE IF NOT EXISTS public.unified_contracts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  type VARCHAR(100) NOT NULL, -- 'Client', 'Employee', 'Vendor'
  party_name VARCHAR(255) NOT NULL, -- Client name, Employee name, or Vendor name
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  value NUMERIC(15,2) NOT NULL DEFAULT 0.00,
  status VARCHAR(100) NOT NULL DEFAULT 'Draft', -- Draft, Pending Signature, Signed, Expired, Terminated
  signature_status VARCHAR(100) DEFAULT 'Unsigned', -- Unsigned, Signed
  signed_at TIMESTAMPTZ,
  signed_by VARCHAR(255),
  contract_file_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_uc_tenant ON public.unified_contracts(tenant_id);
CREATE INDEX IF NOT EXISTS idx_uc_type ON public.unified_contracts(type);

-- Enable RLS
ALTER TABLE public.unified_contracts ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Tenant isolation for unified_contracts" ON public.unified_contracts;
CREATE POLICY "Tenant isolation for unified_contracts" ON public.unified_contracts
  USING (tenant_id = (SELECT tenant_id FROM public.users WHERE id = auth.uid()));


-- 2. Contract Renewals History Audit Table
CREATE TABLE IF NOT EXISTS public.contract_renewals (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  contract_id UUID NOT NULL REFERENCES public.unified_contracts(id) ON DELETE CASCADE,
  previous_end_date DATE NOT NULL,
  new_end_date DATE NOT NULL,
  previous_value NUMERIC(15,2) NOT NULL,
  new_value NUMERIC(15,2) NOT NULL,
  renewed_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
  remarks TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_cr_tenant ON public.contract_renewals(tenant_id);

-- Enable RLS
ALTER TABLE public.contract_renewals ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Tenant isolation for contract_renewals" ON public.contract_renewals;
CREATE POLICY "Tenant isolation for contract_renewals" ON public.contract_renewals
  USING (tenant_id = (SELECT tenant_id FROM public.users WHERE id = auth.uid()));

COMMIT;
