-- Migration for AI Operations Intelligence
-- Relational Foreign Key Schema linked to public.tenants, public.users, and public.employees
-- Created: 2026-07-28

CREATE TABLE IF NOT EXISTS public.ai_operations_insights (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
  category VARCHAR(100) NOT NULL,
  title VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  risk_level VARCHAR(50) DEFAULT 'Low', -- 'Low', 'Moderate', 'High', 'Critical'
  confidence_score DECIMAL(5, 2) DEFAULT 95.50,
  recommended_action TEXT NOT NULL,
  status VARCHAR(50) DEFAULT 'Active',   -- 'Active', 'Investigating', 'Resolved'
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.ai_assistant_chats (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  prompt TEXT NOT NULL,
  response TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE public.ai_operations_insights ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_assistant_chats ENABLE ROW LEVEL SECURITY;

-- Idempotent Tenant Isolation Policies
DROP POLICY IF EXISTS "Tenant isolation for ai_operations_insights" ON public.ai_operations_insights;
CREATE POLICY "Tenant isolation for ai_operations_insights" ON public.ai_operations_insights
  USING (tenant_id = (SELECT tenant_id FROM public.users WHERE id = auth.uid()));

DROP POLICY IF EXISTS "Tenant isolation for ai_assistant_chats" ON public.ai_assistant_chats;
CREATE POLICY "Tenant isolation for ai_assistant_chats" ON public.ai_assistant_chats
  USING (tenant_id = (SELECT tenant_id FROM public.users WHERE id = auth.uid()));
