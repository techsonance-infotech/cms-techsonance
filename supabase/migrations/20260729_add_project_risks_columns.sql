-- Migration: Add impact, probability, and mitigation columns to project_risks_issues
-- Created: 2026-07-29

BEGIN;

ALTER TABLE public.project_risks_issues 
  ADD COLUMN IF NOT EXISTS impact VARCHAR(50) DEFAULT 'Medium',
  ADD COLUMN IF NOT EXISTS probability VARCHAR(50) DEFAULT 'Medium',
  ADD COLUMN IF NOT EXISTS mitigation TEXT;

COMMIT;
