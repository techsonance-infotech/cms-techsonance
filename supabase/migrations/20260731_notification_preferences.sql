-- Migration: User Notification Preferences Schema
-- Created: 2026-07-31

BEGIN;

CREATE TABLE IF NOT EXISTS public.user_notification_preferences (
  user_id UUID PRIMARY KEY REFERENCES public.users(id) ON DELETE CASCADE,
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  in_app_enabled BOOLEAN NOT NULL DEFAULT TRUE,
  email_enabled BOOLEAN NOT NULL DEFAULT TRUE,
  sms_enabled BOOLEAN NOT NULL DEFAULT FALSE,
  whatsapp_enabled BOOLEAN NOT NULL DEFAULT FALSE,
  push_enabled BOOLEAN NOT NULL DEFAULT FALSE,
  task_updates BOOLEAN NOT NULL DEFAULT TRUE,
  attendance_alerts BOOLEAN NOT NULL DEFAULT TRUE,
  approval_requests BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_unp_tenant ON public.user_notification_preferences(tenant_id);

-- Enable RLS
ALTER TABLE public.user_notification_preferences ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Tenant isolation for user_notification_preferences" ON public.user_notification_preferences;
CREATE POLICY "Tenant isolation for user_notification_preferences" ON public.user_notification_preferences
  USING (tenant_id = (SELECT tenant_id FROM public.users WHERE id = auth.uid()));

COMMIT;
