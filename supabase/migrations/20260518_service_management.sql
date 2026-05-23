-- Migration: Service Management Module
-- Target: tickets table creation, automated per-tenant sequential ticketing triggers, and RLS policies.

CREATE TABLE IF NOT EXISTS public.tickets (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id      UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  ticket_number  TEXT, -- populated by trigger
  title          TEXT NOT NULL,
  description    TEXT,
  type           TEXT NOT NULL DEFAULT 'support',      -- support | bug | feature | maintenance
  priority       TEXT NOT NULL DEFAULT 'medium',       -- low | medium | high | critical
  status         TEXT NOT NULL DEFAULT 'open',         -- open | in_progress | waiting | resolved | closed
  assigned_to    UUID REFERENCES public.users(id) ON DELETE SET NULL,
  created_by     UUID REFERENCES public.users(id) ON DELETE SET NULL,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at     TIMESTAMPTZ,
  CONSTRAINT unique_tenant_ticket_number UNIQUE(tenant_id, ticket_number)
);

-- Indices for rapid query performance
CREATE INDEX IF NOT EXISTS idx_tickets_tenant_id ON public.tickets(tenant_id);
CREATE INDEX IF NOT EXISTS idx_tickets_status ON public.tickets(status);
CREATE INDEX IF NOT EXISTS idx_tickets_priority ON public.tickets(priority);

-- Row-Level Security isolation matching custom postgrest authentication context
ALTER TABLE public.tickets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Enable CRUD operations for active tenant users"
  ON public.tickets
  FOR ALL
  USING (tenant_id = (SELECT auth.jwt() ->> 'tenant_id')::uuid)
  WITH CHECK (tenant_id = (SELECT auth.jwt() ->> 'tenant_id')::uuid);

-- Automated sequence increment trigger function to allocate sequential numbers like TKT-0001
CREATE OR REPLACE FUNCTION public.allocate_ticket_number()
RETURNS TRIGGER AS $$
DECLARE
  next_num INT;
BEGIN
  SELECT COALESCE(COUNT(*), 0) + 1 INTO next_num
  FROM public.tickets
  WHERE tenant_id = NEW.tenant_id;

  NEW.ticket_number := 'TKT-' || LPAD(next_num::text, 4, '0');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_allocate_ticket_number ON public.tickets;
CREATE TRIGGER trigger_allocate_ticket_number
  BEFORE INSERT ON public.tickets
  FOR EACH ROW
  EXECUTE FUNCTION public.allocate_ticket_number();
