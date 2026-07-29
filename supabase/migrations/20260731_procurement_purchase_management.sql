-- Migration: Enterprise Procurement & Purchase Management Schema
-- Created: 2026-07-31

BEGIN;

-- 1. Procurement Vendors
CREATE TABLE IF NOT EXISTS public.procurement_vendors (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  contact_email VARCHAR(255) NOT NULL,
  phone VARCHAR(100),
  address TEXT,
  payment_terms VARCHAR(100) DEFAULT 'Net 30',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_pv_tenant ON public.procurement_vendors(tenant_id);

-- Enable RLS
ALTER TABLE public.procurement_vendors ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Tenant isolation for procurement_vendors" ON public.procurement_vendors;
CREATE POLICY "Tenant isolation for procurement_vendors" ON public.procurement_vendors
  USING (tenant_id = (SELECT tenant_id FROM public.users WHERE id = auth.uid()));


-- 2. Purchase Requests
CREATE TABLE IF NOT EXISTS public.purchase_requests (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  requested_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
  item_name VARCHAR(255) NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 1,
  estimated_cost NUMERIC(15,2) NOT NULL DEFAULT 0.00,
  justification TEXT,
  status VARCHAR(100) NOT NULL DEFAULT 'Pending', -- Pending, Approved, Rejected, Ordered
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_pr_tenant ON public.purchase_requests(tenant_id);

-- Enable RLS
ALTER TABLE public.purchase_requests ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Tenant isolation for purchase_requests" ON public.purchase_requests;
CREATE POLICY "Tenant isolation for purchase_requests" ON public.purchase_requests
  USING (tenant_id = (SELECT tenant_id FROM public.users WHERE id = auth.uid()));


-- 3. Purchase Orders (POs)
CREATE TABLE IF NOT EXISTS public.purchase_orders (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  purchase_request_id UUID REFERENCES public.purchase_requests(id) ON DELETE SET NULL,
  vendor_id UUID REFERENCES public.procurement_vendors(id) ON DELETE SET NULL,
  po_number VARCHAR(100) NOT NULL UNIQUE,
  total_amount NUMERIC(15,2) NOT NULL DEFAULT 0.00,
  status VARCHAR(100) NOT NULL DEFAULT 'Draft', -- Draft, Sent, Fulfilled, Cancelled
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_po_tenant ON public.purchase_orders(tenant_id);

-- Enable RLS
ALTER TABLE public.purchase_orders ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Tenant isolation for purchase_orders" ON public.purchase_orders;
CREATE POLICY "Tenant isolation for purchase_orders" ON public.purchase_orders
  USING (tenant_id = (SELECT tenant_id FROM public.users WHERE id = auth.uid()));


-- 4. Goods Receipts
CREATE TABLE IF NOT EXISTS public.goods_receipts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  purchase_order_id UUID NOT NULL REFERENCES public.purchase_orders(id) ON DELETE CASCADE,
  received_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
  received_quantity INTEGER NOT NULL,
  condition VARCHAR(100) NOT NULL DEFAULT 'Good', -- Good, Damaged, Incomplete
  received_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_gr_tenant ON public.goods_receipts(tenant_id);

-- Enable RLS
ALTER TABLE public.goods_receipts ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Tenant isolation for goods_receipts" ON public.goods_receipts;
CREATE POLICY "Tenant isolation for goods_receipts" ON public.goods_receipts
  USING (tenant_id = (SELECT tenant_id FROM public.users WHERE id = auth.uid()));


-- 5. Purchase Invoices
CREATE TABLE IF NOT EXISTS public.purchase_invoices (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  purchase_order_id UUID NOT NULL REFERENCES public.purchase_orders(id) ON DELETE CASCADE,
  invoice_number VARCHAR(100) NOT NULL,
  amount NUMERIC(15,2) NOT NULL DEFAULT 0.00,
  is_matched BOOLEAN NOT NULL DEFAULT false, -- 3-way matching validation flag
  status VARCHAR(100) NOT NULL DEFAULT 'Unpaid', -- Unpaid, Paid
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_pi_tenant ON public.purchase_invoices(tenant_id);

-- Enable RLS
ALTER TABLE public.purchase_invoices ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Tenant isolation for purchase_invoices" ON public.purchase_invoices;
CREATE POLICY "Tenant isolation for purchase_invoices" ON public.purchase_invoices
  USING (tenant_id = (SELECT tenant_id FROM public.users WHERE id = auth.uid()));

COMMIT;
