-- ============================================================
-- SQL Migration: Add JSONB details columns for ELM workflows
-- ============================================================

ALTER TABLE public.employee_onboarding ADD COLUMN IF NOT EXISTS details jsonb DEFAULT '{}'::jsonb;
ALTER TABLE public.employee_offboarding ADD COLUMN IF NOT EXISTS details jsonb DEFAULT '{}'::jsonb;
