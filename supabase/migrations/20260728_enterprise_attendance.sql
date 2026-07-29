-- Supabase Migration: Enterprise Attendance Engine Schema
-- Created: 2026-07-28

BEGIN;

-- 1. Create attendance_policies table
CREATE TABLE IF NOT EXISTS public.attendance_policies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    name VARCHAR(150) NOT NULL,
    is_default BOOLEAN DEFAULT false NOT NULL,
    standard_hours DOUBLE PRECISION DEFAULT 9.0 NOT NULL,
    min_hours_half_day DOUBLE PRECISION DEFAULT 4.0 NOT NULL,
    min_hours_full_day DOUBLE PRECISION DEFAULT 8.0 NOT NULL,
    grace_period_late_minutes INTEGER DEFAULT 15 NOT NULL,
    grace_period_early_exit_minutes INTEGER DEFAULT 15 NOT NULL,
    is_flexible BOOLEAN DEFAULT false NOT NULL,
    rounding_minutes INTEGER DEFAULT 0 NOT NULL,
    auto_mark_absence BOOLEAN DEFAULT true NOT NULL,
    unpaid_break_duration_minutes INTEGER DEFAULT 60 NOT NULL,
    paid_break_duration_minutes INTEGER DEFAULT 0 NOT NULL,
    overtime_eligibility BOOLEAN DEFAULT true NOT NULL,
    overtime_min_minutes INTEGER DEFAULT 30 NOT NULL,
    overtime_rate_multiplier NUMERIC(3,2) DEFAULT 1.50 NOT NULL,
    weekly_off_days VARCHAR(100) DEFAULT 'Saturday,Sunday' NOT NULL,
    target_assignment JSONB DEFAULT '{}'::jsonb NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- 2. Create attendance_requests table
CREATE TABLE IF NOT EXISTS public.attendance_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    employee_id BIGINT NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    time_in TIMESTAMPTZ,
    time_out TIMESTAMPTZ,
    duration INTEGER,
    status VARCHAR(50) DEFAULT 'pending' NOT NULL,
    check_in_method VARCHAR(50) DEFAULT 'manual' NOT NULL,
    location TEXT,
    reader_id VARCHAR(100),
    notes TEXT,
    violation_flags JSONB DEFAULT '{}'::jsonb,
    metadata JSONB DEFAULT '{}'::jsonb,
    requested_time_in TIMESTAMPTZ,
    requested_time_out TIMESTAMPTZ,
    reason_type VARCHAR(100) DEFAULT 'regularization' NOT NULL,
    attachment_url TEXT,
    gps_latitude DOUBLE PRECISION,
    gps_longitude DOUBLE PRECISION,
    ai_fraud_check JSONB DEFAULT '{}'::jsonb,
    approver_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
    hr_approver_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
    resolution_notes TEXT,
    sla_due_date TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- 3. Create attendance_exceptions table
CREATE TABLE IF NOT EXISTS public.attendance_exceptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    employee_id BIGINT NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    exception_type VARCHAR(100) NOT NULL,
    severity VARCHAR(50) DEFAULT 'medium' NOT NULL,
    details TEXT,
    ai_detected BOOLEAN DEFAULT false NOT NULL,
    ai_confidence NUMERIC(5,2) DEFAULT 0.00,
    resolved BOOLEAN DEFAULT false NOT NULL,
    resolved_at TIMESTAMPTZ,
    resolved_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
    resolution_notes TEXT,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- 4. Create attendance_overtime_requests table
CREATE TABLE IF NOT EXISTS public.attendance_overtime_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    employee_id BIGINT NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    calculated_overtime_minutes INTEGER DEFAULT 0 NOT NULL,
    approved_overtime_minutes INTEGER,
    status VARCHAR(50) DEFAULT 'pending' NOT NULL,
    reason TEXT,
    approver_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
    approved_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- 5. Create attendance_locks table
CREATE TABLE IF NOT EXISTS public.attendance_locks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    year INTEGER NOT NULL,
    month INTEGER NOT NULL,
    locked BOOLEAN DEFAULT true NOT NULL,
    locked_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
    locked_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    UNIQUE (tenant_id, year, month)
);

-- 6. Create domain_events table (Recreate clean)
CREATE TABLE IF NOT EXISTS public.domain_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    event_name VARCHAR(100) NOT NULL,
    payload JSONB NOT NULL,
    processed BOOLEAN DEFAULT false NOT NULL,
    processed_at TIMESTAMPTZ,
    error_message TEXT,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- 7. Create immutable_audit_logs table (Recreate clean)
CREATE TABLE IF NOT EXISTS public.immutable_audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    employee_id BIGINT REFERENCES public.employees(id) ON DELETE SET NULL,
    actor_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
    action_type VARCHAR(100) NOT NULL,
    attendance_record_id BIGINT REFERENCES public.attendance_records(id) ON DELETE SET NULL,
    previous_values JSONB,
    updated_values JSONB,
    client_ip VARCHAR(45),
    user_agent TEXT,
    gps_coordinates VARCHAR(100),
    browser VARCHAR(100),
    operating_system VARCHAR(100),
    metadata JSONB,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Triggers for updated_at
DROP TRIGGER IF EXISTS trigger_update_attendance_policies_timestamp ON public.attendance_policies;
CREATE TRIGGER trigger_update_attendance_policies_timestamp
    BEFORE UPDATE ON public.attendance_policies
    FOR EACH ROW
    EXECUTE FUNCTION public.set_current_timestamp_updated_at();

DROP TRIGGER IF EXISTS trigger_update_attendance_requests_timestamp ON public.attendance_requests;
CREATE TRIGGER trigger_update_attendance_requests_timestamp
    BEFORE UPDATE ON public.attendance_requests
    FOR EACH ROW
    EXECUTE FUNCTION public.set_current_timestamp_updated_at();

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_attendance_policies_tenant ON public.attendance_policies(tenant_id);
CREATE INDEX IF NOT EXISTS idx_attendance_requests_tenant ON public.attendance_requests(tenant_id, employee_id, date);
CREATE INDEX IF NOT EXISTS idx_attendance_exceptions_tenant ON public.attendance_exceptions(tenant_id, employee_id, date);
CREATE INDEX IF NOT EXISTS idx_attendance_overtime_tenant ON public.attendance_overtime_requests(tenant_id, employee_id, date);
CREATE INDEX IF NOT EXISTS idx_attendance_locks_tenant ON public.attendance_locks(tenant_id, year, month);
CREATE INDEX IF NOT EXISTS idx_domain_events_tenant ON public.domain_events(tenant_id, processed);
CREATE INDEX IF NOT EXISTS idx_immutable_audit_logs_tenant ON public.immutable_audit_logs(tenant_id, created_at);

-- Enable RLS
ALTER TABLE public.attendance_policies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendance_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendance_exceptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendance_overtime_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendance_locks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.domain_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.immutable_audit_logs ENABLE ROW LEVEL SECURITY;

-- Tenant Isolation Policies
DROP POLICY IF EXISTS "Tenant isolation for attendance_policies" ON public.attendance_policies;
CREATE POLICY "Tenant isolation for attendance_policies" ON public.attendance_policies
  USING (tenant_id = public.current_tenant_id()) WITH CHECK (tenant_id = public.current_tenant_id());

DROP POLICY IF EXISTS "Tenant isolation for attendance_requests" ON public.attendance_requests;
CREATE POLICY "Tenant isolation for attendance_requests" ON public.attendance_requests
  USING (tenant_id = public.current_tenant_id()) WITH CHECK (tenant_id = public.current_tenant_id());

DROP POLICY IF EXISTS "Tenant isolation for attendance_exceptions" ON public.attendance_exceptions;
CREATE POLICY "Tenant isolation for attendance_exceptions" ON public.attendance_exceptions
  USING (tenant_id = public.current_tenant_id()) WITH CHECK (tenant_id = public.current_tenant_id());

DROP POLICY IF EXISTS "Tenant isolation for attendance_overtime_requests" ON public.attendance_overtime_requests;
CREATE POLICY "Tenant isolation for attendance_overtime_requests" ON public.attendance_overtime_requests
  USING (tenant_id = public.current_tenant_id()) WITH CHECK (tenant_id = public.current_tenant_id());

DROP POLICY IF EXISTS "Tenant isolation for attendance_locks" ON public.attendance_locks;
CREATE POLICY "Tenant isolation for attendance_locks" ON public.attendance_locks
  USING (tenant_id = public.current_tenant_id()) WITH CHECK (tenant_id = public.current_tenant_id());

DROP POLICY IF EXISTS "Tenant isolation for domain_events" ON public.domain_events;
CREATE POLICY "Tenant isolation for domain_events" ON public.domain_events
  USING (tenant_id = public.current_tenant_id()) WITH CHECK (tenant_id = public.current_tenant_id());

DROP POLICY IF EXISTS "Tenant isolation for immutable_audit_logs" ON public.immutable_audit_logs;
CREATE POLICY "Tenant isolation for immutable_audit_logs" ON public.immutable_audit_logs
  USING (tenant_id = public.current_tenant_id()) WITH CHECK (tenant_id = public.current_tenant_id());

COMMIT;
