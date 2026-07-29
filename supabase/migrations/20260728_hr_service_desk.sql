-- Migration for Enterprise HR Service Desk & Helpdesk Management
-- Relational Foreign Key Schema linked to public.tenants, public.users, and public.employees
-- Created: 2026-07-28

CREATE TABLE IF NOT EXISTS public.hr_service_tickets (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  ticket_number VARCHAR(50) NOT NULL,
  category VARCHAR(100) NOT NULL,
  subject VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  priority VARCHAR(50) NOT NULL DEFAULT 'Normal',     -- 'Low', 'Normal', 'High', 'Urgent', 'Critical'
  status VARCHAR(50) NOT NULL DEFAULT 'Open',           -- 'Open', 'In_Progress', 'Escalated', 'Resolved', 'Closed'
  assigned_to UUID REFERENCES public.users(id) ON DELETE SET NULL,
  sla_hours INTEGER DEFAULT 24,
  escalation_level INTEGER DEFAULT 1,                  -- 1: L1 Helpdesk, 2: HR Manager, 3: VP HR
  resolution_notes TEXT,
  internal_notes TEXT,
  csat_rating INTEGER CHECK (csat_rating >= 1 AND csat_rating <= 5),
  csat_feedback TEXT,
  ai_auto_suggested_answer TEXT,
  due_date TIMESTAMPTZ,
  resolved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.hr_knowledge_base (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  article_number VARCHAR(50) NOT NULL,
  category VARCHAR(100) NOT NULL,
  title VARCHAR(255) NOT NULL,
  content TEXT NOT NULL,
  view_count INTEGER DEFAULT 0,
  helpful_count INTEGER DEFAULT 0,
  is_faq BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.hr_ticket_comments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  ticket_id UUID NOT NULL REFERENCES public.hr_service_tickets(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  comment_text TEXT NOT NULL,
  is_internal_note BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE public.hr_service_tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hr_knowledge_base ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hr_ticket_comments ENABLE ROW LEVEL SECURITY;

-- Idempotent Tenant Isolation Policies
DROP POLICY IF EXISTS "Tenant isolation for hr_service_tickets" ON public.hr_service_tickets;
CREATE POLICY "Tenant isolation for hr_service_tickets" ON public.hr_service_tickets
  USING (tenant_id = (SELECT tenant_id FROM public.users WHERE id = auth.uid()));

DROP POLICY IF EXISTS "Tenant isolation for hr_knowledge_base" ON public.hr_knowledge_base;
CREATE POLICY "Tenant isolation for hr_knowledge_base" ON public.hr_knowledge_base
  USING (tenant_id = (SELECT tenant_id FROM public.users WHERE id = auth.uid()));

DROP POLICY IF EXISTS "Tenant isolation for hr_ticket_comments" ON public.hr_ticket_comments;
CREATE POLICY "Tenant isolation for hr_ticket_comments" ON public.hr_ticket_comments
  USING (tenant_id = (SELECT tenant_id FROM public.users WHERE id = auth.uid()));
