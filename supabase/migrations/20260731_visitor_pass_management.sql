-- Migration: Enterprise Visitor & Visitor Pass Management Schema
-- Created: 2026-07-31

BEGIN;

-- 1. Visitors directory
CREATE TABLE IF NOT EXISTS public.visitors (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  full_name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL,
  phone VARCHAR(100),
  company VARCHAR(255),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (tenant_id, email)
);

CREATE INDEX IF NOT EXISTS idx_vis_tenant ON public.visitors(tenant_id);

-- Enable RLS
ALTER TABLE public.visitors ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Tenant isolation for visitors" ON public.visitors;
CREATE POLICY "Tenant isolation for visitors" ON public.visitors
  USING (tenant_id = (SELECT tenant_id FROM public.users WHERE id = auth.uid()));


-- 2. Visitor Passes
CREATE TABLE IF NOT EXISTS public.visitor_passes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  visitor_id UUID NOT NULL REFERENCES public.visitors(id) ON DELETE CASCADE,
  host_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
  purpose VARCHAR(255) NOT NULL,
  scheduled_start TIMESTAMPTZ NOT NULL,
  scheduled_end TIMESTAMPTZ NOT NULL,
  status VARCHAR(100) NOT NULL DEFAULT 'Pre-Registered', -- Pre-Registered, Approved, Rejected, Checked In, Checked Out
  qr_code_token VARCHAR(255) NOT NULL UNIQUE,
  security_approved_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
  security_approved_at TIMESTAMPTZ,
  check_in_at TIMESTAMPTZ,
  check_out_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_vp_tenant ON public.visitor_passes(tenant_id);

-- Enable RLS
ALTER TABLE public.visitor_passes ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Tenant isolation for visitor_passes" ON public.visitor_passes;
CREATE POLICY "Tenant isolation for visitor_passes" ON public.visitor_passes
  USING (tenant_id = (SELECT tenant_id FROM public.users WHERE id = auth.uid()));

COMMIT;
