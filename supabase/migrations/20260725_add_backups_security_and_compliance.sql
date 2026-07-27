-- ============================================================
-- Migrations for Backups, Compliance, Audits, Security & Data
-- ============================================================

-- 1. Create tenant_backups table
CREATE TABLE IF NOT EXISTS public.tenant_backups (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  file_name text NOT NULL,
  file_size text NOT NULL,
  status text NOT NULL DEFAULT 'completed', -- 'completed', 'failed', 'in_progress'
  backup_type text NOT NULL DEFAULT 'manual', -- 'manual', 'automatic', 'snapshot'
  download_url text,
  schedule_interval text DEFAULT 'weekly', -- 'daily', 'weekly', 'monthly', 'none'
  created_at timestamptz NOT NULL DEFAULT now()
);

-- 2. Create settings_audit_logs table
CREATE TABLE IF NOT EXISTS public.settings_audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  action_by text NOT NULL, -- email or username
  action_name text NOT NULL, -- e.g., 'Update Invoice Terms', 'Enable 2FA'
  old_value text,
  new_value text,
  ip_address text,
  user_agent text,
  device_info text,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- 3. Create compliance_settings table
CREATE TABLE IF NOT EXISTS public.compliance_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE UNIQUE,
  gdpr_enabled boolean NOT NULL DEFAULT false,
  soc2_enabled boolean NOT NULL DEFAULT false,
  iso_enabled boolean NOT NULL DEFAULT false,
  hipaa_enabled boolean NOT NULL DEFAULT false,
  data_residency text NOT NULL DEFAULT 'US-East', -- 'US-East', 'EU-West', 'AP-South'
  consent_required boolean NOT NULL DEFAULT false,
  cookie_policy text DEFAULT '',
  retention_years integer NOT NULL DEFAULT 7,
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- 4. Create security_settings table
CREATE TABLE IF NOT EXISTS public.security_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE UNIQUE,
  min_password_length integer NOT NULL DEFAULT 8,
  require_symbols boolean NOT NULL DEFAULT true,
  mfa_enabled boolean NOT NULL DEFAULT false,
  sso_enabled boolean NOT NULL DEFAULT false,
  allowed_ips text DEFAULT '', -- comma separated
  allowed_countries text DEFAULT '', -- comma separated
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- 5. Create user_login_history table
CREATE TABLE IF NOT EXISTS public.user_login_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  email text NOT NULL,
  status text NOT NULL, -- 'success', 'failed'
  ip_address text,
  user_agent text,
  device_info text,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Enable Row-Level Security
ALTER TABLE public.tenant_backups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.settings_audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.compliance_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.security_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_login_history ENABLE ROW LEVEL SECURITY;

-- Tenant Isolation Policies
CREATE POLICY tenant_backups_isolation ON public.tenant_backups
  FOR ALL USING (tenant_id = public.current_tenant_id()) WITH CHECK (tenant_id = public.current_tenant_id());

CREATE POLICY settings_audit_logs_isolation ON public.settings_audit_logs
  FOR ALL USING (tenant_id = public.current_tenant_id()) WITH CHECK (tenant_id = public.current_tenant_id());

CREATE POLICY compliance_settings_isolation ON public.compliance_settings
  FOR ALL USING (tenant_id = public.current_tenant_id()) WITH CHECK (tenant_id = public.current_tenant_id());

CREATE POLICY security_settings_isolation ON public.security_settings
  FOR ALL USING (tenant_id = public.current_tenant_id()) WITH CHECK (tenant_id = public.current_tenant_id());

CREATE POLICY user_login_history_isolation ON public.user_login_history
  FOR ALL USING (tenant_id = public.current_tenant_id()) WITH CHECK (tenant_id = public.current_tenant_id());

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_tenant_backups_tenant ON public.tenant_backups(tenant_id);
CREATE INDEX IF NOT EXISTS idx_settings_audit_logs_tenant ON public.settings_audit_logs(tenant_id);
CREATE INDEX IF NOT EXISTS idx_compliance_settings_tenant ON public.compliance_settings(tenant_id);
CREATE INDEX IF NOT EXISTS idx_security_settings_tenant ON public.security_settings(tenant_id);
CREATE INDEX IF NOT EXISTS idx_user_login_history_tenant ON public.user_login_history(tenant_id);
