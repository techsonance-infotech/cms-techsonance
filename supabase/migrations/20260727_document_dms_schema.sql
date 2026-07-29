-- Supabase Migration: Centralized Document Management System (DMS) Extended Schema
-- Created: 2026-07-27

-- 1. Extend the public.employee_documents table with DMS parameters
ALTER TABLE public.employee_documents
ADD COLUMN IF NOT EXISTS document_number text,
ADD COLUMN IF NOT EXISTS version integer DEFAULT 1,
ADD COLUMN IF NOT EXISTS confidentiality_level text DEFAULT 'internal', -- internal, restricted, confidential, highly_confidential
ADD COLUMN IF NOT EXISTS ocr_extracted_data jsonb,
ADD COLUMN IF NOT EXISTS ai_summary text,
ADD COLUMN IF NOT EXISTS checksum text,
ADD COLUMN IF NOT EXISTS file_size_bytes integer,
ADD COLUMN IF NOT EXISTS issued_by text;

-- 2. Create document_versions table
CREATE TABLE IF NOT EXISTS public.document_versions (
    id SERIAL PRIMARY KEY,
    tenant_id uuid NOT NULL,
    document_id integer REFERENCES public.employee_documents(id) ON DELETE CASCADE,
    version integer NOT NULL,
    file_url text NOT NULL,
    change_summary text,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. Create document_signatures table
CREATE TABLE IF NOT EXISTS public.document_signatures (
    id SERIAL PRIMARY KEY,
    tenant_id uuid NOT NULL,
    document_id integer REFERENCES public.employee_documents(id) ON DELETE CASCADE,
    signer_role text NOT NULL,
    signer_name text NOT NULL,
    signed_at timestamp with time zone,
    signature_hash text,
    status text DEFAULT 'pending' -- pending, signed, rejected
);

-- 4. Enable Row Level Security (RLS) policies
ALTER TABLE public.document_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.document_signatures ENABLE ROW LEVEL SECURITY;

CREATE POLICY tenant_isolation_policy ON public.document_versions
    FOR ALL USING (tenant_id = ((auth.jwt() ->> 'tenant_id')::uuid));

CREATE POLICY tenant_isolation_policy ON public.document_signatures
    FOR ALL USING (tenant_id = ((auth.jwt() ->> 'tenant_id')::uuid));
