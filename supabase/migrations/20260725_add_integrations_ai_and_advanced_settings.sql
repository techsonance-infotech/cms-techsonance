-- ============================================================
-- PART 6: Integrations, Schema Engine, AI, API Management & Advanced Settings
-- Run this in: Supabase Dashboard → SQL Editor → New Query
-- Date: 2026-07-25
-- ============================================================

-- 1. Tenant Integrations Table
CREATE TABLE IF NOT EXISTS public.tenant_integrations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  provider_slug text NOT NULL,
  config jsonb NOT NULL DEFAULT '{}'::jsonb,
  enabled boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT tenant_integrations_tenant_provider_key UNIQUE (tenant_id, provider_slug)
);

CREATE INDEX IF NOT EXISTS idx_tenant_integrations_tenant
  ON public.tenant_integrations(tenant_id);

ALTER TABLE public.tenant_integrations ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'tenant_integrations'
      AND policyname = 'tenant_integrations_isolation'
  ) THEN
    CREATE POLICY tenant_integrations_isolation
      ON public.tenant_integrations
      FOR ALL
      USING (tenant_id = public.current_tenant_id())
      WITH CHECK (tenant_id = public.current_tenant_id());
  END IF;
END $$;

-- 2. Custom Form Schemas Table (Dynamic Form Layouts)
CREATE TABLE IF NOT EXISTS public.custom_form_schemas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  entity_slug text NOT NULL,
  version integer NOT NULL DEFAULT 1,
  active boolean NOT NULL DEFAULT true,
  schema_json jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_custom_form_schemas_tenant_entity
  ON public.custom_form_schemas(tenant_id, entity_slug);

ALTER TABLE public.custom_form_schemas ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'custom_form_schemas'
      AND policyname = 'custom_form_schemas_isolation'
  ) THEN
    CREATE POLICY custom_form_schemas_isolation
      ON public.custom_form_schemas
      FOR ALL
      USING (tenant_id = public.current_tenant_id())
      WITH CHECK (tenant_id = public.current_tenant_id());
  END IF;
END $$;

-- 3. Tenant Knowledge Base Table (AI Docs)
CREATE TABLE IF NOT EXISTS public.tenant_knowledge_base (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  file_name text NOT NULL,
  file_url text NOT NULL,
  size text NOT NULL,
  is_indexed boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_tenant_kb_tenant
  ON public.tenant_knowledge_base(tenant_id);

ALTER TABLE public.tenant_knowledge_base ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'tenant_knowledge_base'
      AND policyname = 'tenant_knowledge_base_isolation'
  ) THEN
    CREATE POLICY tenant_knowledge_base_isolation
      ON public.tenant_knowledge_base
      FOR ALL
      USING (tenant_id = public.current_tenant_id())
      WITH CHECK (tenant_id = public.current_tenant_id());
  END IF;
END $$;

-- 4. Tenant API Keys Table (Developer Mode)
CREATE TABLE IF NOT EXISTS public.tenant_api_keys (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  key_name text NOT NULL,
  prefix text NOT NULL,
  hashed_key text NOT NULL UNIQUE,
  permissions jsonb NOT NULL DEFAULT '[]'::jsonb,
  rate_limit integer NOT NULL DEFAULT 60,
  enabled boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_tenant_api_keys_tenant
  ON public.tenant_api_keys(tenant_id);

ALTER TABLE public.tenant_api_keys ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'tenant_api_keys'
      AND policyname = 'tenant_api_keys_isolation'
  ) THEN
    CREATE POLICY tenant_api_keys_isolation
      ON public.tenant_api_keys
      FOR ALL
      USING (tenant_id = public.current_tenant_id())
      WITH CHECK (tenant_id = public.current_tenant_id());
  END IF;
END $$;

-- 5. Tenant Webhooks Table (API Subscriptions)
CREATE TABLE IF NOT EXISTS public.tenant_webhooks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  url text NOT NULL,
  secret text NOT NULL,
  events jsonb NOT NULL DEFAULT '[]'::jsonb,
  enabled boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_tenant_webhooks_tenant
  ON public.tenant_webhooks(tenant_id);

ALTER TABLE public.tenant_webhooks ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'tenant_webhooks'
      AND policyname = 'tenant_webhooks_isolation'
  ) THEN
    CREATE POLICY tenant_webhooks_isolation
      ON public.tenant_webhooks
      FOR ALL
      USING (tenant_id = public.current_tenant_id())
      WITH CHECK (tenant_id = public.current_tenant_id());
  END IF;
END $$;

-- 6. Tenant API Logs Table (API Playground & Logs)
CREATE TABLE IF NOT EXISTS public.tenant_api_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  path text NOT NULL,
  method text NOT NULL,
  status_code integer NOT NULL,
  ip_address text,
  duration_ms integer NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_tenant_api_logs_tenant
  ON public.tenant_api_logs(tenant_id);

ALTER TABLE public.tenant_api_logs ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'tenant_api_logs'
      AND policyname = 'tenant_api_logs_isolation'
  ) THEN
    CREATE POLICY tenant_api_logs_isolation
      ON public.tenant_api_logs
      FOR ALL
      USING (tenant_id = public.current_tenant_id())
      WITH CHECK (tenant_id = public.current_tenant_id());
  END IF;
END $$;

-- 7. Advanced Company Settings Columns
ALTER TABLE public.company_settings ADD COLUMN IF NOT EXISTS developer_mode boolean DEFAULT false;
ALTER TABLE public.company_settings ADD COLUMN IF NOT EXISTS maintenance_mode boolean DEFAULT false;
ALTER TABLE public.company_settings ADD COLUMN IF NOT EXISTS feature_flags jsonb DEFAULT '{}'::jsonb;
ALTER TABLE public.company_settings ADD COLUMN IF NOT EXISTS beta_features jsonb DEFAULT '[]'::jsonb;
ALTER TABLE public.company_settings ADD COLUMN IF NOT EXISTS experimental_features jsonb DEFAULT '[]'::jsonb;
ALTER TABLE public.company_settings ADD COLUMN IF NOT EXISTS cache_settings jsonb DEFAULT '{}'::jsonb;
ALTER TABLE public.company_settings ADD COLUMN IF NOT EXISTS cdn_settings jsonb DEFAULT '{}'::jsonb;
ALTER TABLE public.company_settings ADD COLUMN IF NOT EXISTS health_status jsonb DEFAULT '{}'::jsonb;

-- 8. AI Orchestration Columns
ALTER TABLE public.company_settings ADD COLUMN IF NOT EXISTS ai_model text DEFAULT 'gemini-1.5-pro';
ALTER TABLE public.company_settings ADD COLUMN IF NOT EXISTS ai_temperature double precision DEFAULT 0.7;
ALTER TABLE public.company_settings ADD COLUMN IF NOT EXISTS ai_prompt_template text DEFAULT '';
ALTER TABLE public.company_settings ADD COLUMN IF NOT EXISTS ai_assistant_name text DEFAULT 'Antigravity Assistant';

