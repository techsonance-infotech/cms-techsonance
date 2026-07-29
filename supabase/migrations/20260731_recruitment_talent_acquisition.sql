-- Migration: Enterprise Recruitment & Talent Acquisition Schema
-- Created: 2026-07-31

BEGIN;

-- 1. Job Requisitions (Requisitons and positions)
CREATE TABLE IF NOT EXISTS public.job_requisitions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  department VARCHAR(255) NOT NULL,
  location VARCHAR(255) NOT NULL,
  employment_type VARCHAR(100) NOT NULL DEFAULT 'Full-time', -- Full-time, Part-time, Contract, Internship
  experience_level VARCHAR(100) NOT NULL DEFAULT 'Mid', -- Entry, Mid, Senior, Executive
  status VARCHAR(100) NOT NULL DEFAULT 'Draft', -- Draft, Open, On Hold, Closed
  description TEXT,
  requirements TEXT,
  salary_range_min NUMERIC(15,2) DEFAULT 0.00,
  salary_range_max NUMERIC(15,2) DEFAULT 0.00,
  created_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_jr_tenant ON public.job_requisitions(tenant_id);

-- Enable RLS
ALTER TABLE public.job_requisitions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Tenant isolation for job_requisitions" ON public.job_requisitions;
CREATE POLICY "Tenant isolation for job_requisitions" ON public.job_requisitions
  USING (tenant_id = (SELECT tenant_id FROM public.users WHERE id = auth.uid()));


-- 2. Candidate Profiles (CRM, Resumes, and Referrals)
CREATE TABLE IF NOT EXISTS public.candidate_profiles (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  first_name VARCHAR(255) NOT NULL,
  last_name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL,
  phone VARCHAR(100),
  resume_url TEXT,
  skills TEXT[] DEFAULT '{}'::TEXT[],
  source VARCHAR(255) DEFAULT 'Career Portal', -- Referral, LinkedIn, Career Portal, Agency, Campus
  referred_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
  talent_pool VARCHAR(255) DEFAULT 'Engineering', -- Engineering, Sales, Marketing, HR
  screening_score INTEGER DEFAULT 0, -- AI computed screening score (0-100)
  ai_recommendation TEXT, -- AI reasoning feedback
  status VARCHAR(100) NOT NULL DEFAULT 'Applied', -- Applied, Screening, Interviewing, Offered, Hired, Rejected
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (tenant_id, email)
);

CREATE INDEX IF NOT EXISTS idx_cp_tenant ON public.candidate_profiles(tenant_id);

-- Enable RLS
ALTER TABLE public.candidate_profiles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Tenant isolation for candidate_profiles" ON public.candidate_profiles;
CREATE POLICY "Tenant isolation for candidate_profiles" ON public.candidate_profiles
  USING (tenant_id = (SELECT tenant_id FROM public.users WHERE id = auth.uid()));


-- 3. Job Applications (Mapping of Candidates to specific Job Requisitions)
CREATE TABLE IF NOT EXISTS public.job_applications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  job_requisition_id UUID NOT NULL REFERENCES public.job_requisitions(id) ON DELETE CASCADE,
  candidate_id UUID NOT NULL REFERENCES public.candidate_profiles(id) ON DELETE CASCADE,
  current_stage VARCHAR(100) NOT NULL DEFAULT 'Applied', -- Applied, Phone Screen, Technical, Executive, Offer, Preboarding
  resume_summary TEXT,
  match_score INTEGER DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (tenant_id, job_requisition_id, candidate_id)
);

CREATE INDEX IF NOT EXISTS idx_ja_tenant ON public.job_applications(tenant_id);

-- Enable RLS
ALTER TABLE public.job_applications ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Tenant isolation for job_applications" ON public.job_applications;
CREATE POLICY "Tenant isolation for job_applications" ON public.job_applications
  USING (tenant_id = (SELECT tenant_id FROM public.users WHERE id = auth.uid()));


-- 4. Interview Scheduling (Interviews, Feedback, and scorecards)
CREATE TABLE IF NOT EXISTS public.interviews (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  application_id UUID NOT NULL REFERENCES public.job_applications(id) ON DELETE CASCADE,
  scheduled_at TIMESTAMPTZ NOT NULL,
  interview_type VARCHAR(100) NOT NULL, -- Screen, Coding, System Design, CulturalFit
  status VARCHAR(100) NOT NULL DEFAULT 'Scheduled', -- Scheduled, Completed, Cancelled
  feedback_score INTEGER DEFAULT 0, -- Score from 1 to 5
  feedback_notes TEXT,
  interviewer_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_int_tenant ON public.interviews(tenant_id);

-- Enable RLS
ALTER TABLE public.interviews ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Tenant isolation for interviews" ON public.interviews;
CREATE POLICY "Tenant isolation for interviews" ON public.interviews
  USING (tenant_id = (SELECT tenant_id FROM public.users WHERE id = auth.uid()));


-- 5. Offer Management (Offer letters, approvals and signatures)
CREATE TABLE IF NOT EXISTS public.recruitment_offers (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  application_id UUID NOT NULL REFERENCES public.job_applications(id) ON DELETE CASCADE,
  base_salary NUMERIC(15,2) NOT NULL DEFAULT 0.00,
  joining_date DATE NOT NULL,
  status VARCHAR(100) NOT NULL DEFAULT 'Draft', -- Draft, Pending Approval, Approved, Extended, Accepted, Rejected
  approval_chain JSONB DEFAULT '[]'::JSONB, -- Approval checklist details
  created_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ro_tenant ON public.recruitment_offers(tenant_id);

-- Enable RLS
ALTER TABLE public.recruitment_offers ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Tenant isolation for recruitment_offers" ON public.recruitment_offers;
CREATE POLICY "Tenant isolation for recruitment_offers" ON public.recruitment_offers
  USING (tenant_id = (SELECT tenant_id FROM public.users WHERE id = auth.uid()));

COMMIT;
