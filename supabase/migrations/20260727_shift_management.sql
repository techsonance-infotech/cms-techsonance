-- Migration for Enterprise Shift Management Engine
-- Relational Foreign Key Schema linked to public.tenants & public.users & public.employees
-- Created: 2026-07-27

CREATE TABLE IF NOT EXISTS public.shift_definitions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  shift_code VARCHAR(50) NOT NULL,
  name VARCHAR(150) NOT NULL,
  shift_type VARCHAR(50) NOT NULL DEFAULT 'general', 
  -- Types: 'general', 'morning', 'evening', 'night', 'split', 'rotational', 'flexible', 'custom'
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  split_start_time_2 TIME,
  split_end_time_2 TIME,
  break_duration_minutes INTEGER DEFAULT 60,
  differential_pay_percentage NUMERIC(5,2) DEFAULT 0.00,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.shift_roster_assignments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  employee_table_id BIGINT REFERENCES public.employees(id) ON DELETE CASCADE,
  shift_id UUID REFERENCES public.shift_definitions(id) ON DELETE SET NULL,
  roster_date DATE NOT NULL,
  is_weekly_off BOOLEAN DEFAULT false,
  status VARCHAR(50) DEFAULT 'Assigned',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.shift_swap_requests (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  requester_user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  target_user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  requester_roster_date DATE NOT NULL,
  target_roster_date DATE NOT NULL,
  reason TEXT,
  status VARCHAR(50) DEFAULT 'Pending',
  approver_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
  approved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE public.shift_definitions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shift_roster_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shift_swap_requests ENABLE ROW LEVEL SECURITY;

-- Idempotent Tenant Isolation Policies
DROP POLICY IF EXISTS "Tenant isolation for shift_definitions" ON public.shift_definitions;
CREATE POLICY "Tenant isolation for shift_definitions" ON public.shift_definitions
  USING (tenant_id = (SELECT tenant_id FROM public.users WHERE id = auth.uid()));

DROP POLICY IF EXISTS "Tenant isolation for shift_roster_assignments" ON public.shift_roster_assignments;
CREATE POLICY "Tenant isolation for shift_roster_assignments" ON public.shift_roster_assignments
  USING (tenant_id = (SELECT tenant_id FROM public.users WHERE id = auth.uid()));

DROP POLICY IF EXISTS "Tenant isolation for shift_swap_requests" ON public.shift_swap_requests;
CREATE POLICY "Tenant isolation for shift_swap_requests" ON public.shift_swap_requests
  USING (tenant_id = (SELECT tenant_id FROM public.users WHERE id = auth.uid()));
