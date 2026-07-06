-- Supabase Migration: Add new employee and user onboarding fields
-- Date: 2026-07-06

-- 1. Alter public.users table to add personal details and office details
DO $$ 
BEGIN 
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='users' AND column_name='middle_name') THEN
    ALTER TABLE public.users 
      ADD COLUMN middle_name text,
      ADD COLUMN gender text,
      ADD COLUMN office_email text,
      ADD COLUMN account_expiry_date date;
  END IF;
END $$;

-- 2. Alter public.employees table to add extensive profile and compliance columns
DO $$ 
BEGIN 
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='employees' AND column_name='marital_status') THEN
    ALTER TABLE public.employees 
      -- Personal Info
      ADD COLUMN marital_status text,
      ADD COLUMN blood_group text,
      ADD COLUMN nationality text,
      ADD COLUMN personal_id_number text,
      -- Work Info
      ADD COLUMN probation_period integer,
      ADD COLUMN confirmation_date date,
      ADD COLUMN work_location text,
      ADD COLUMN work_shift text,
      ADD COLUMN notice_period integer,
      -- Financials / Compliance
      ADD COLUMN currency text default 'INR',
      ADD COLUMN branch_name text,
      ADD COLUMN esi_number text,
      ADD COLUMN pan_number text,
      ADD COLUMN aadhaar_number text,
      -- Documents (Urls)
      ADD COLUMN aadhaar_card_url text,
      ADD COLUMN pan_card_url text,
      ADD COLUMN address_proof_url text,
      ADD COLUMN education_certificate_url text,
      ADD COLUMN experience_certificate_url text,
      ADD COLUMN resume_url text,
      -- Permissions
      ADD COLUMN permissions jsonb,
      -- Emergency Contact
      ADD COLUMN emergency_contact_name text,
      ADD COLUMN emergency_contact_relationship text,
      ADD COLUMN emergency_contact_phone text,
      ADD COLUMN emergency_contact_address text,
      -- Additional Info
      ADD COLUMN languages_known text,
      ADD COLUMN linkedin_profile text,
      ADD COLUMN github_profile text,
      ADD COLUMN previous_company text,
      ADD COLUMN referral_source text,
      ADD COLUMN notes text;
  END IF;
END $$;
