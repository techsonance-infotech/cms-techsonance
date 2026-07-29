-- Supabase Migration: Verification and Free Trial Licensing
-- Date: 2026-05-24

-- 1. Add verification columns to public.users
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS is_email_verified boolean NOT NULL DEFAULT false;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS verification_token text;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS verification_token_expires_at timestamptz;

-- 2. Add licensing columns to public.tenants
ALTER TABLE public.tenants ADD COLUMN IF NOT EXISTS license_key text;
ALTER TABLE public.tenants ADD COLUMN IF NOT EXISTS license_expires_at timestamptz;

-- 3. Add tax compliance and document columns to public.company_settings
ALTER TABLE public.company_settings ADD COLUMN IF NOT EXISTS gstin text;
ALTER TABLE public.company_settings ADD COLUMN IF NOT EXISTS pan text;
ALTER TABLE public.company_settings ADD COLUMN IF NOT EXISTS registration_certificate_url text;
ALTER TABLE public.company_settings ADD COLUMN IF NOT EXISTS pan_card_url text;
ALTER TABLE public.company_settings ADD COLUMN IF NOT EXISTS gst_certificate_url text;

-- 4. Mark all existing users as verified so they can log in seamlessly
UPDATE public.users SET is_email_verified = true WHERE is_email_verified = false;
