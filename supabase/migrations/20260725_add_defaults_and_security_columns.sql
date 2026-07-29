-- Add workforce defaults and security columns to public.company_settings table
ALTER TABLE public.company_settings ADD COLUMN IF NOT EXISTS default_probation integer DEFAULT 6;
ALTER TABLE public.company_settings ADD COLUMN IF NOT EXISTS notice_period integer DEFAULT 90;
ALTER TABLE public.company_settings ADD COLUMN IF NOT EXISTS emp_id_prefix text DEFAULT 'TS-';
ALTER TABLE public.company_settings ADD COLUMN IF NOT EXISTS username_pattern text DEFAULT 'first.last';
ALTER TABLE public.company_settings ADD COLUMN IF NOT EXISTS email_pattern text DEFAULT 'username@techsonance.com';
ALTER TABLE public.company_settings ADD COLUMN IF NOT EXISTS leave_policy text DEFAULT 'Standard Privilege Leaves (24 days)';
ALTER TABLE public.company_settings ADD COLUMN IF NOT EXISTS shift_default text DEFAULT 'General Engineering Shift (09:30 AM - 06:30 PM)';
ALTER TABLE public.company_settings ADD COLUMN IF NOT EXISTS joining_workflow text DEFAULT 'Standard Paperless Onboarding';
ALTER TABLE public.company_settings ADD COLUMN IF NOT EXISTS confirmation_workflow text DEFAULT 'Manager Review required';
ALTER TABLE public.company_settings ADD COLUMN IF NOT EXISTS auto_emp_id boolean DEFAULT true;
ALTER TABLE public.company_settings ADD COLUMN IF NOT EXISTS working_hours numeric DEFAULT 9;
ALTER TABLE public.company_settings ADD COLUMN IF NOT EXISTS weekend_rules text DEFAULT 'Saturday & Sunday Off';

ALTER TABLE public.company_settings ADD COLUMN IF NOT EXISTS mfa_enforced boolean DEFAULT true;
ALTER TABLE public.company_settings ADD COLUMN IF NOT EXISTS session_timeout integer DEFAULT 60;
ALTER TABLE public.company_settings ADD COLUMN IF NOT EXISTS password_min_length integer DEFAULT 8;
ALTER TABLE public.company_settings ADD COLUMN IF NOT EXISTS ip_whitelist text;
ALTER TABLE public.company_settings ADD COLUMN IF NOT EXISTS allowed_domains text;
ALTER TABLE public.company_settings ADD COLUMN IF NOT EXISTS password_policy text DEFAULT 'High Security (Minimum 12 chars, alphanumeric)';
ALTER TABLE public.company_settings ADD COLUMN IF NOT EXISTS device_policy text DEFAULT 'Unrestricted personal and corporate devices allowed';
ALTER TABLE public.company_settings ADD COLUMN IF NOT EXISTS login_restrictions text DEFAULT 'Allowed at all times from trusted locations';
