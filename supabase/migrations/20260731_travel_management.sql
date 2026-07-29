-- Migration: Enterprise Travel Management Schema
-- Created: 2026-07-31

BEGIN;

-- 1. Travel Requests
CREATE TABLE IF NOT EXISTS public.travel_requests (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  employee_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  destination VARCHAR(255) NOT NULL,
  purpose TEXT NOT NULL,
  departure_date DATE NOT NULL,
  return_date DATE NOT NULL,
  status VARCHAR(100) NOT NULL DEFAULT 'Pending', -- Pending, Approved, Rejected, Completed
  visa_required BOOLEAN NOT NULL DEFAULT false,
  visa_status VARCHAR(100) DEFAULT 'N/A', -- N/A, Pending, Approved
  advance_amount NUMERIC(15,2) DEFAULT 0.00,
  advance_status VARCHAR(100) DEFAULT 'N/A', -- N/A, Requested, Disbursed
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_tr_tenant ON public.travel_requests(tenant_id);

-- Enable RLS
ALTER TABLE public.travel_requests ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Tenant isolation for travel_requests" ON public.travel_requests;
CREATE POLICY "Tenant isolation for travel_requests" ON public.travel_requests
  USING (tenant_id = (SELECT tenant_id FROM public.users WHERE id = auth.uid()));


-- 2. Travel Itineraries
CREATE TABLE IF NOT EXISTS public.travel_itineraries (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  travel_request_id UUID NOT NULL REFERENCES public.travel_requests(id) ON DELETE CASCADE,
  flight_train_details TEXT,
  accommodation_details TEXT,
  ticket_file_url TEXT,
  hotel_booking_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ti_tenant ON public.travel_itineraries(tenant_id);

-- Enable RLS
ALTER TABLE public.travel_itineraries ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Tenant isolation for travel_itineraries" ON public.travel_itineraries;
CREATE POLICY "Tenant isolation for travel_itineraries" ON public.travel_itineraries
  USING (tenant_id = (SELECT tenant_id FROM public.users WHERE id = auth.uid()));


-- 3. Travel Expenses
CREATE TABLE IF NOT EXISTS public.travel_expenses (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  travel_request_id UUID NOT NULL REFERENCES public.travel_requests(id) ON DELETE CASCADE,
  description VARCHAR(255) NOT NULL,
  amount NUMERIC(15,2) NOT NULL DEFAULT 0.00,
  receipt_url TEXT,
  status VARCHAR(100) NOT NULL DEFAULT 'Pending', -- Pending, Approved, Settled
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_te_tenant ON public.travel_expenses(tenant_id);

-- Enable RLS
ALTER TABLE public.travel_expenses ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Tenant isolation for travel_expenses" ON public.travel_expenses;
CREATE POLICY "Tenant isolation for travel_expenses" ON public.travel_expenses
  USING (tenant_id = (SELECT tenant_id FROM public.users WHERE id = auth.uid()));

COMMIT;
