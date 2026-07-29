-- Supabase Migration: Enterprise Attendance Settings & Geofencing Policies Schema
-- Created: 2026-07-27

-- Acquire locks in a consistent order at the start to prevent concurrent read/write deadlock
LOCK TABLE public.tenants IN SHARE MODE;

-- 1. Create tenant_attendance_settings table
CREATE TABLE IF NOT EXISTS public.tenant_attendance_settings (
    id SERIAL PRIMARY KEY,
    tenant_id uuid NOT NULL UNIQUE REFERENCES public.tenants(id) ON DELETE CASCADE,
    office_latitude double precision,
    office_longitude double precision,
    geofence_radius_meters integer DEFAULT 500 NOT NULL,
    allowed_ips text DEFAULT '' NOT NULL,
    standard_work_hours double precision DEFAULT 9.0 NOT NULL,
    created_at timestamptz DEFAULT now() NOT NULL,
    updated_at timestamptz DEFAULT now() NOT NULL
);

-- 2. Create index for tenant lookup efficiency
CREATE INDEX IF NOT EXISTS idx_attendance_settings_tenant ON public.tenant_attendance_settings(tenant_id);

-- 3. Enable Row-Level Security (RLS)
ALTER TABLE public.tenant_attendance_settings ENABLE ROW LEVEL SECURITY;

-- 4. Create RLS Policies for multi-tenant isolation
CREATE POLICY tenant_isolation_policy ON public.tenant_attendance_settings
    FOR ALL
    USING (tenant_id::text = auth.jwt() ->> 'tenant_id')
    WITH CHECK (tenant_id::text = auth.jwt() ->> 'tenant_id');

-- 5. Trigger for updated_at tracking
CREATE OR REPLACE FUNCTION public.set_current_timestamp_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_attendance_settings_timestamp
    BEFORE UPDATE ON public.tenant_attendance_settings
    FOR EACH ROW
    EXECUTE FUNCTION public.set_current_timestamp_updated_at();
