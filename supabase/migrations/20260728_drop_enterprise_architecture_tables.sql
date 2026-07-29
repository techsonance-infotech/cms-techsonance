-- Migration: Drop Enterprise Architecture Tables
-- Description: Safely drops domain_events, immutable_audit_logs, and enterprise_configurable_policies tables and associated RLS policies.

BEGIN;

-- Drop Tables (CASCADE removes dependent indexes, policies, and foreign keys)
DROP TABLE IF EXISTS public.domain_events CASCADE;
DROP TABLE IF EXISTS public.immutable_audit_logs CASCADE;
DROP TABLE IF EXISTS public.enterprise_configurable_policies CASCADE;

COMMIT;
