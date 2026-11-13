-- Migration: Add all Employee and User Onboarding Schema Columns
-- Description: Adds all missing onboarding fields to public.users and public.employees as physical database columns.
-- Date: 2026-10-29

-- 1. Alter public.users table to add identity and office profile columns
ALTER TABLE public.users 
  ADD COLUMN IF NOT EXISTS middle_name text,
  ADD COLUMN IF NOT EXISTS gender text,
  ADD COLUMN IF NOT EXISTS office_email text,
  ADD COLUMN IF NOT EXISTS account_expiry_date date;

-- 2. Alter public.employees table to add extensive personal, work, payroll, compliance, and additional info columns
ALTER TABLE public.employees 
  -- Personal Details
  ADD COLUMN IF NOT EXISTS marital_status text,
  ADD COLUMN IF NOT EXISTS blood_group text,
  ADD COLUMN IF NOT EXISTS nationality text,
  ADD COLUMN IF NOT EXISTS personal_id_number text,
  ADD COLUMN IF NOT EXISTS middle_name text,
  ADD COLUMN IF NOT EXISTS gender text,

  -- Work Profile
  ADD COLUMN IF NOT EXISTS probation_period integer,
  ADD COLUMN IF NOT EXISTS confirmation_date date,
  ADD COLUMN IF NOT EXISTS work_location text,
  ADD COLUMN IF NOT EXISTS work_shift text,
  ADD COLUMN IF NOT EXISTS notice_period integer,
  ADD COLUMN IF NOT EXISTS office_email text,

  -- Financials, Banking & Statutory Compliance
  ADD COLUMN IF NOT EXISTS currency text DEFAULT 'INR',
  ADD COLUMN IF NOT EXISTS branch_name text,
  ADD COLUMN IF NOT EXISTS esi_number text,
  ADD COLUMN IF NOT EXISTS pan_number text,
  ADD COLUMN IF NOT EXISTS aadhaar_number text,

  -- Uploaded Document Vault URLs
  ADD COLUMN IF NOT EXISTS aadhaar_card_url text,
  ADD COLUMN IF NOT EXISTS pan_card_url text,
  ADD COLUMN IF NOT EXISTS address_proof_url text,
  ADD COLUMN IF NOT EXISTS education_certificate_url text,
  ADD COLUMN IF NOT EXISTS experience_certificate_url text,
  ADD COLUMN IF NOT EXISTS resume_url text,

  -- Permissions Matrix
  ADD COLUMN IF NOT EXISTS permissions jsonb DEFAULT '[]'::jsonb,

  -- Emergency Contact Details
  ADD COLUMN IF NOT EXISTS emergency_contact_name text,
  ADD COLUMN IF NOT EXISTS emergency_contact_relationship text,
  ADD COLUMN IF NOT EXISTS emergency_contact_phone text,
  ADD COLUMN IF NOT EXISTS emergency_contact_address text,

  -- Additional Information & Professional Profiles
  ADD COLUMN IF NOT EXISTS languages_known text,
  ADD COLUMN IF NOT EXISTS linkedin_profile text,
  ADD COLUMN IF NOT EXISTS github_profile text,
  ADD COLUMN IF NOT EXISTS previous_company text,
  ADD COLUMN IF NOT EXISTS referral_source text,
  ADD COLUMN IF NOT EXISTS notes text;

-- 3. Create helpful indexes on frequently filtered employee columns
CREATE INDEX IF NOT EXISTS idx_employees_department ON public.employees(department);
CREATE INDEX IF NOT EXISTS idx_employees_designation ON public.employees(designation);
CREATE INDEX IF NOT EXISTS idx_employees_employee_id ON public.employees(employee_id);
CREATE INDEX IF NOT EXISTS idx_employees_manager_id ON public.employees(manager_id);
