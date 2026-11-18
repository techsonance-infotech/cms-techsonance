-- Supabase Migration: Multi-Employee, Multi-Device Employee Drafts Table
-- Created: 2026-11-18

CREATE TABLE IF NOT EXISTS public.employee_drafts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    created_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
    updated_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
    display_name TEXT NOT NULL DEFAULT 'Untitled Employee Draft',
    email TEXT,
    department TEXT,
    designation TEXT,
    employee_id_preview TEXT,
    current_step TEXT NOT NULL DEFAULT 'personal',
    completion_percent INTEGER NOT NULL DEFAULT 0 CHECK (completion_percent >= 0 AND completion_percent <= 100),
    form_data JSONB NOT NULL DEFAULT '{}'::jsonb,
    status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'submitted', 'archived')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_employee_drafts_tenant_status_updated
    ON public.employee_drafts(tenant_id, status, updated_at DESC);

CREATE INDEX IF NOT EXISTS idx_employee_drafts_tenant_creator
    ON public.employee_drafts(tenant_id, created_by);

ALTER TABLE public.employee_drafts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS tenant_isolation_policy ON public.employee_drafts;
CREATE POLICY tenant_isolation_policy ON public.employee_drafts
    FOR ALL USING (tenant_id = ((auth.jwt() ->> 'tenant_id')::uuid));

