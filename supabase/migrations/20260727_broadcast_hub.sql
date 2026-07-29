-- Complete Migration for Broadcast Hub Engine
-- Created: 2026-07-27

CREATE TABLE IF NOT EXISTS public.broadcast_categories (
  id VARCHAR(100) PRIMARY KEY,
  tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE,
  name VARCHAR(150) NOT NULL,
  icon_name VARCHAR(100) NOT NULL DEFAULT 'Layers',
  badge_color VARCHAR(100) NOT NULL DEFAULT 'bg-slate-100 text-slate-700',
  default_priority VARCHAR(50) NOT NULL DEFAULT 'info',
  default_title VARCHAR(255) NOT NULL DEFAULT '',
  default_template TEXT NOT NULL DEFAULT '',
  requires_ack_recommended BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.broadcast_gateways (
  id VARCHAR(100) PRIMARY KEY,
  tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE,
  name VARCHAR(150) NOT NULL,
  channel_key VARCHAR(50) NOT NULL,
  status VARCHAR(50) NOT NULL DEFAULT 'Disconnected',
  uptime VARCHAR(50) DEFAULT '0%',
  speed VARCHAR(100) DEFAULT '0 msg/min',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.broadcasts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  broadcast_code VARCHAR(50) NOT NULL,
  category VARCHAR(100) NOT NULL,
  category_name VARCHAR(150) NOT NULL,
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  priority VARCHAR(50) NOT NULL DEFAULT 'info',
  target_audience_scope VARCHAR(50) NOT NULL DEFAULT 'all',
  target_departments JSONB DEFAULT '[]'::jsonb,
  target_branches JSONB DEFAULT '[]'::jsonb,
  channels JSONB DEFAULT '{}'::jsonb,
  status VARCHAR(50) NOT NULL DEFAULT 'Delivered',
  total_target INTEGER NOT NULL DEFAULT 0,
  delivered_count INTEGER NOT NULL DEFAULT 0,
  read_rate DECIMAL(5,2) DEFAULT 0.00,
  requires_acknowledgement BOOLEAN DEFAULT false,
  ack_deadline TIMESTAMPTZ,
  ack_rate DECIMAL(5,2) DEFAULT 0.00,
  acknowledged_count INTEGER DEFAULT 0,
  scheduled_at TIMESTAMPTZ,
  created_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.broadcast_acknowledgements (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  broadcast_id UUID NOT NULL REFERENCES public.broadcasts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  employee_name VARCHAR(255),
  department VARCHAR(100),
  branch VARCHAR(100),
  channel_delivered VARCHAR(50),
  status VARCHAR(50) NOT NULL DEFAULT 'Pending',
  acknowledged_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.broadcast_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.broadcast_gateways ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.broadcasts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.broadcast_acknowledgements ENABLE ROW LEVEL SECURITY;

-- Drop Existing Policies (Idempotent Migration Safety)
DROP POLICY IF EXISTS "Tenant isolation for broadcast_categories" ON public.broadcast_categories;
DROP POLICY IF EXISTS "Tenant isolation for broadcast_gateways" ON public.broadcast_gateways;
DROP POLICY IF EXISTS "Tenant isolation for broadcasts" ON public.broadcasts;
DROP POLICY IF EXISTS "Tenant isolation for broadcast_acknowledgements" ON public.broadcast_acknowledgements;

-- Tenant Isolation Policies
CREATE POLICY "Tenant isolation for broadcast_categories" ON public.broadcast_categories
  USING (tenant_id IS NULL OR tenant_id = (SELECT tenant_id FROM public.users WHERE id = auth.uid()));

CREATE POLICY "Tenant isolation for broadcast_gateways" ON public.broadcast_gateways
  USING (tenant_id IS NULL OR tenant_id = (SELECT tenant_id FROM public.users WHERE id = auth.uid()));

CREATE POLICY "Tenant isolation for broadcasts" ON public.broadcasts
  USING (tenant_id = (SELECT tenant_id FROM public.users WHERE id = auth.uid()));

CREATE POLICY "Tenant isolation for broadcast_acknowledgements" ON public.broadcast_acknowledgements
  USING (tenant_id = (SELECT tenant_id FROM public.users WHERE id = auth.uid()));
