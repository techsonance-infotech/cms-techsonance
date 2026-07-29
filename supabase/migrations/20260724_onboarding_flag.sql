-- Add onboarding_completed flag to company_settings
ALTER TABLE public.company_settings ADD COLUMN IF NOT EXISTS onboarding_completed boolean NOT NULL DEFAULT false;
