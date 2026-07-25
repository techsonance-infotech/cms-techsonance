-- Add missing company settings columns to public.company_settings table
ALTER TABLE public.company_settings ADD COLUMN IF NOT EXISTS favicon_url text;
ALTER TABLE public.company_settings ADD COLUMN IF NOT EXISTS legal_name text;
ALTER TABLE public.company_settings ADD COLUMN IF NOT EXISTS workspace_name text;
ALTER TABLE public.company_settings ADD COLUMN IF NOT EXISTS org_code text;
ALTER TABLE public.company_settings ADD COLUMN IF NOT EXISTS industry text;
ALTER TABLE public.company_settings ADD COLUMN IF NOT EXISTS business_type text;
ALTER TABLE public.company_settings ADD COLUMN IF NOT EXISTS timezone text;
ALTER TABLE public.company_settings ADD COLUMN IF NOT EXISTS currency text;
ALTER TABLE public.company_settings ADD COLUMN IF NOT EXISTS fiscal_year text;
ALTER TABLE public.company_settings ADD COLUMN IF NOT EXISTS cin_number text;
ALTER TABLE public.company_settings ADD COLUMN IF NOT EXISTS msme_number text;
ALTER TABLE public.company_settings ADD COLUMN IF NOT EXISTS emergency_contact text;
ALTER TABLE public.company_settings ADD COLUMN IF NOT EXISTS support_email text;
ALTER TABLE public.company_settings ADD COLUMN IF NOT EXISTS support_phone text;
