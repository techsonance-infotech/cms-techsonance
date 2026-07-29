-- Migration for Enterprise HR Automation & Automated Workflows
-- Relational Foreign Key Schema linked to public.tenants, public.users, and public.employees
-- Created: 2026-07-28

CREATE TABLE IF NOT EXISTS public.hr_automation_rules (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  rule_name VARCHAR(255) NOT NULL,
  category VARCHAR(100) NOT NULL,
  trigger_schedule VARCHAR(100) DEFAULT 'Daily at 08:00 AM',
  channel VARCHAR(50) DEFAULT 'Email & Push', -- 'Email & Push', 'Slack & WhatsApp', 'In-App Notification'
  is_enabled BOOLEAN DEFAULT true,
  execution_count INTEGER DEFAULT 0,
  last_run_at TIMESTAMPTZ,
  template_body TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.hr_automation_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  rule_id UUID REFERENCES public.hr_automation_rules(id) ON DELETE CASCADE,
  rule_category VARCHAR(100) NOT NULL,
  recipient_user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
  recipient_name VARCHAR(255),
  message_sent TEXT NOT NULL,
  status VARCHAR(50) DEFAULT 'Dispatched', -- 'Dispatched', 'Failed', 'Pending'
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE public.hr_automation_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hr_automation_logs ENABLE ROW LEVEL SECURITY;

-- Idempotent Tenant Isolation Policies
DROP POLICY IF EXISTS "Tenant isolation for hr_automation_rules" ON public.hr_automation_rules;
CREATE POLICY "Tenant isolation for hr_automation_rules" ON public.hr_automation_rules
  USING (tenant_id = (SELECT tenant_id FROM public.users WHERE id = auth.uid()));

DROP POLICY IF EXISTS "Tenant isolation for hr_automation_logs" ON public.hr_automation_logs;
CREATE POLICY "Tenant isolation for hr_automation_logs" ON public.hr_automation_logs
  USING (tenant_id = (SELECT tenant_id FROM public.users WHERE id = auth.uid()));
