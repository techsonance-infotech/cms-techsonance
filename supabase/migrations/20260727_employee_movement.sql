-- Migration for Employee Movement & Progression Engine
-- Relational Foreign Key Schema linked to public.users & public.employees
-- Created: 2026-07-27

CREATE TABLE IF NOT EXISTS public.employee_movements (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  movement_code VARCHAR(50) NOT NULL,
  
  -- Foreign Key relationship to existing employee/user single source of truth
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  employee_table_id BIGINT REFERENCES public.employees(id) ON DELETE CASCADE,
  
  movement_type VARCHAR(100) NOT NULL,
  effective_date DATE NOT NULL,
  reason TEXT,
  notes TEXT,
  
  -- Department & Location shifts
  previous_department VARCHAR(100),
  new_department VARCHAR(100),
  previous_branch VARCHAR(100),
  new_branch VARCHAR(100),
  previous_business_unit VARCHAR(100),
  new_business_unit VARCHAR(100),
  
  -- Manager Relationships
  previous_manager_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
  new_manager_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
  
  -- Designation & Grade
  previous_designation VARCHAR(150),
  new_designation VARCHAR(150),
  previous_grade VARCHAR(50),
  new_grade VARCHAR(50),
  previous_employment_type VARCHAR(50),
  new_employment_type VARCHAR(50),
  
  -- Compensation Revision
  previous_salary NUMERIC(15,4) DEFAULT 0.0000,
  new_salary NUMERIC(15,4) DEFAULT 0.0000,
  salary_increment_percentage NUMERIC(5,2) DEFAULT 0.00,
  salary_effective_date DATE,
  
  -- Workflow Approval State
  status VARCHAR(50) NOT NULL DEFAULT 'Draft',
  approval_stage VARCHAR(100) DEFAULT 'Manager Review',
  approval_history JSONB DEFAULT '[]'::jsonb,
  auto_update_profile BOOLEAN DEFAULT true,
  attachments JSONB DEFAULT '[]'::jsonb,
  
  created_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.employee_movement_history (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  movement_id UUID NOT NULL REFERENCES public.employee_movements(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  action_taken VARCHAR(100) NOT NULL,
  actor_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
  previous_status VARCHAR(50),
  new_status VARCHAR(50),
  comments TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE public.employee_movements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.employee_movement_history ENABLE ROW LEVEL SECURITY;

-- Drop Existing Policies (Idempotent Safety)
DROP POLICY IF EXISTS "Tenant isolation for employee_movements" ON public.employee_movements;
DROP POLICY IF EXISTS "Tenant isolation for employee_movement_history" ON public.employee_movement_history;

-- Create Tenant Isolation Policies
CREATE POLICY "Tenant isolation for employee_movements" ON public.employee_movements
  USING (tenant_id = (SELECT tenant_id FROM public.users WHERE id = auth.uid()));

CREATE POLICY "Tenant isolation for employee_movement_history" ON public.employee_movement_history
  USING (tenant_id = (SELECT tenant_id FROM public.users WHERE id = auth.uid()));
