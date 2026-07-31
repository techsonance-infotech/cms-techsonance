-- Migration: Add onboarding_step to clients table
-- Created: 2026-08-02

ALTER TABLE public.clients ADD COLUMN IF NOT EXISTS onboarding_step INTEGER DEFAULT 1;
