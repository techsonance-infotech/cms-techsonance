-- Migration: Enterprise Knowledge Base & SOP Portal Schema
-- Created: 2026-07-31

BEGIN;

-- 1. Knowledge Base Documents
CREATE TABLE IF NOT EXISTS public.knowledge_documents (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  content TEXT NOT NULL,
  type VARCHAR(100) NOT NULL DEFAULT 'Article', -- Policy, Article, FAQ, Announcement, SOP
  category VARCHAR(255) NOT NULL DEFAULT 'General', -- HR, Tech, Security, Finance, Operations
  version INTEGER NOT NULL DEFAULT 1,
  created_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_kd_tenant_type ON public.knowledge_documents(tenant_id, type);

-- Enable RLS
ALTER TABLE public.knowledge_documents ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Tenant isolation for knowledge_documents" ON public.knowledge_documents;
CREATE POLICY "Tenant isolation for knowledge_documents" ON public.knowledge_documents
  USING (tenant_id = (SELECT tenant_id FROM public.users WHERE id = auth.uid()));


-- 2. Knowledge Base Document Version Audit Trails
CREATE TABLE IF NOT EXISTS public.knowledge_document_versions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  document_id UUID NOT NULL REFERENCES public.knowledge_documents(id) ON DELETE CASCADE,
  version INTEGER NOT NULL,
  title VARCHAR(255) NOT NULL,
  content TEXT NOT NULL,
  changed_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
  change_summary TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_kdv_tenant_doc ON public.knowledge_document_versions(tenant_id, document_id);

-- Enable RLS
ALTER TABLE public.knowledge_document_versions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Tenant isolation for knowledge_document_versions" ON public.knowledge_document_versions;
CREATE POLICY "Tenant isolation for knowledge_document_versions" ON public.knowledge_document_versions
  USING (tenant_id = (SELECT tenant_id FROM public.users WHERE id = auth.uid()));

COMMIT;
