-- Migration: Create client_contacts table for CRM contacts
-- Created: 2026-08-06

CREATE TABLE IF NOT EXISTS public.client_contacts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  client_id BIGINT REFERENCES public.clients(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  designation VARCHAR(255),
  department VARCHAR(255),
  email VARCHAR(255),
  phone VARCHAR(50),
  social_linkedin VARCHAR(255),
  social_twitter VARCHAR(255),
  notes TEXT,
  is_primary BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.client_contacts ENABLE ROW LEVEL SECURITY;

-- Tenant isolation policy
DROP POLICY IF EXISTS "Tenant isolation for client_contacts" ON public.client_contacts;
CREATE POLICY "Tenant isolation for client_contacts" ON public.client_contacts
  USING (tenant_id = (SELECT tenant_id FROM public.users WHERE id = auth.uid()));
