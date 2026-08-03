-- Migration: Create quotations and quotation_items tables
-- Created: 2026-08-06

CREATE TABLE IF NOT EXISTS public.quotations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  quotation_number TEXT NOT NULL,
  client_id BIGINT REFERENCES public.clients(id) ON DELETE SET NULL,
  inquiry_id BIGINT REFERENCES public.inquiries(id) ON DELETE SET NULL,
  contact_name TEXT,
  contact_email TEXT,
  contact_phone TEXT,
  subject TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'Draft',
  subtotal NUMERIC(15,2) DEFAULT 0,
  discount_type TEXT DEFAULT 'percentage',
  discount_value NUMERIC(15,2) DEFAULT 0,
  tax_rate NUMERIC(5,2) DEFAULT 18.00,
  tax_amount NUMERIC(15,2) DEFAULT 0,
  total NUMERIC(15,2) DEFAULT 0,
  currency TEXT DEFAULT 'INR',
  validity_days INTEGER DEFAULT 30,
  valid_until DATE,
  payment_terms TEXT,
  delivery_timeline TEXT,
  terms_conditions TEXT,
  notes TEXT,
  version INTEGER DEFAULT 1,
  approved_by TEXT,
  approved_at TIMESTAMPTZ,
  sent_at TIMESTAMPTZ,
  viewed_at TIMESTAMPTZ,
  accepted_at TIMESTAMPTZ,
  rejected_at TIMESTAMPTZ,
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT quotations_tenant_number UNIQUE (tenant_id, quotation_number)
);

CREATE TABLE IF NOT EXISTS public.quotation_items (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  quotation_id UUID NOT NULL REFERENCES public.quotations(id) ON DELETE CASCADE,
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  description TEXT NOT NULL,
  quantity NUMERIC(10,2) DEFAULT 1,
  unit TEXT DEFAULT 'Unit',
  unit_price NUMERIC(15,2) DEFAULT 0,
  amount NUMERIC(15,2) DEFAULT 0,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.quotations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quotation_items ENABLE ROW LEVEL SECURITY;

-- Tenant isolation policies
DROP POLICY IF EXISTS "Tenant isolation for quotations" ON public.quotations;
CREATE POLICY "Tenant isolation for quotations" ON public.quotations
  USING (tenant_id = (SELECT tenant_id FROM public.users WHERE id = auth.uid()));

DROP POLICY IF EXISTS "Tenant isolation for quotation_items" ON public.quotation_items;
CREATE POLICY "Tenant isolation for quotation_items" ON public.quotation_items
  USING (tenant_id = (SELECT tenant_id FROM public.users WHERE id = auth.uid()));

-- Indexes
CREATE INDEX IF NOT EXISTS idx_quotations_tenant ON public.quotations(tenant_id);
CREATE INDEX IF NOT EXISTS idx_quotations_client ON public.quotations(client_id);
CREATE INDEX IF NOT EXISTS idx_quotation_items_quotation ON public.quotation_items(quotation_id);
