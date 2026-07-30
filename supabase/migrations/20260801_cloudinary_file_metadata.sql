-- Supabase Migration: Centralized Cloudinary File Metadata Table
-- Created: 2026-07-30

CREATE TABLE IF NOT EXISTS public.file_metadata (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    module_name TEXT NOT NULL,
    entity_type TEXT NOT NULL,
    entity_id TEXT NOT NULL,
    public_id TEXT NOT NULL UNIQUE,
    secure_url TEXT NOT NULL,
    original_filename TEXT NOT NULL,
    stored_filename TEXT NOT NULL,
    resource_type TEXT NOT NULL,
    format TEXT NOT NULL,
    mime_type TEXT NOT NULL,
    size_bytes BIGINT NOT NULL,
    width INTEGER,
    height INTEGER,
    duration NUMERIC,
    folder_path TEXT NOT NULL,
    tags TEXT[] DEFAULT '{}',
    checksum TEXT,
    uploaded_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
    uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    deleted_at TIMESTAMP WITH TIME ZONE,
    access_level TEXT DEFAULT 'restricted' NOT NULL, -- 'public' or 'restricted'
    version INTEGER DEFAULT 1 NOT NULL,
    audit_info JSONB DEFAULT '{}'::jsonb
);

CREATE INDEX IF NOT EXISTS idx_file_metadata_tenant ON public.file_metadata(tenant_id);
CREATE INDEX IF NOT EXISTS idx_file_metadata_checksum ON public.file_metadata(checksum);
CREATE INDEX IF NOT EXISTS idx_file_metadata_module ON public.file_metadata(module_name);
CREATE INDEX IF NOT EXISTS idx_file_metadata_entity ON public.file_metadata(entity_type, entity_id);

ALTER TABLE public.file_metadata ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS tenant_isolation_policy ON public.file_metadata;
CREATE POLICY tenant_isolation_policy ON public.file_metadata
    FOR ALL USING (tenant_id = ((auth.jwt() ->> 'tenant_id')::uuid));
