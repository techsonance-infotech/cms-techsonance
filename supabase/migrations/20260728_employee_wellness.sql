-- Migration for Employee Wellness Operations
-- Relational Foreign Key Schema linked to public.tenants, public.users, and public.employees
-- Created: 2026-07-28

CREATE TABLE IF NOT EXISTS public.wellness_programs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  category VARCHAR(100) NOT NULL, -- 'Health Checkups', 'Mental Wellness', 'Counselling', 'EAP Assistance', 'Vaccination Drive', 'Fitness Challenges', 'Wellness Campaigns'
  description TEXT NOT NULL,
  schedule_date TIMESTAMPTZ,
  location VARCHAR(255) DEFAULT 'Onsite Clinic / Tele-Health',
  capacity INTEGER DEFAULT 100,
  enrolled_count INTEGER DEFAULT 0,
  status VARCHAR(50) DEFAULT 'Active',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.wellness_appointments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  program_id UUID REFERENCES public.wellness_programs(id) ON DELETE CASCADE,
  category VARCHAR(100) NOT NULL,
  appointment_date TIMESTAMPTZ NOT NULL,
  doctor_counselor_name VARCHAR(150),
  notes TEXT,
  status VARCHAR(50) DEFAULT 'Scheduled', -- 'Scheduled', 'Completed', 'Cancelled'
  burnout_risk_score VARCHAR(50) DEFAULT 'Low', -- 'Low', 'Moderate', 'High', 'Severe'
  stress_index INTEGER DEFAULT 25,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.wellness_surveys (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  work_life_balance_rating INTEGER CHECK (work_life_balance_rating >= 1 AND work_life_balance_rating <= 5),
  work_stress_level INTEGER CHECK (work_stress_level >= 1 AND work_stress_level <= 5),
  sleep_quality_rating INTEGER CHECK (sleep_quality_rating >= 1 AND sleep_quality_rating <= 5),
  feedback_comments TEXT,
  ai_recommendation TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE public.wellness_programs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wellness_appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wellness_surveys ENABLE ROW LEVEL SECURITY;

-- Idempotent Tenant Isolation Policies
DROP POLICY IF EXISTS "Tenant isolation for wellness_programs" ON public.wellness_programs;
CREATE POLICY "Tenant isolation for wellness_programs" ON public.wellness_programs
  USING (tenant_id = (SELECT tenant_id FROM public.users WHERE id = auth.uid()));

DROP POLICY IF EXISTS "Tenant isolation for wellness_appointments" ON public.wellness_appointments;
CREATE POLICY "Tenant isolation for wellness_appointments" ON public.wellness_appointments
  USING (tenant_id = (SELECT tenant_id FROM public.users WHERE id = auth.uid()));

DROP POLICY IF EXISTS "Tenant isolation for wellness_surveys" ON public.wellness_surveys;
CREATE POLICY "Tenant isolation for wellness_surveys" ON public.wellness_surveys
  USING (tenant_id = (SELECT tenant_id FROM public.users WHERE id = auth.uid()));
