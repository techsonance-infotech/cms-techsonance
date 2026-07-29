-- Supabase Migration: Enterprise Training, Learning & Certification Management Schema
-- Created: 2026-07-27

-- Acquire locks in a consistent order at the start to prevent concurrent read/write deadlock
LOCK TABLE public.training_programs IN ACCESS EXCLUSIVE MODE;
LOCK TABLE public.training_enrollments IN ACCESS EXCLUSIVE MODE;

-- 1. Extend training_programs with LMS specifications
ALTER TABLE public.training_programs
ADD COLUMN IF NOT EXISTS code text,
ADD COLUMN IF NOT EXISTS category text DEFAULT 'Technical',
ADD COLUMN IF NOT EXISTS subcategory text,
ADD COLUMN IF NOT EXISTS difficulty_level text DEFAULT 'Intermediate', -- Beginner, Intermediate, Advanced, Expert
ADD COLUMN IF NOT EXISTS target_audience text,
ADD COLUMN IF NOT EXISTS delivery_method text DEFAULT 'Self-Paced', -- Online, Classroom, Hybrid, Self-Paced
ADD COLUMN IF NOT EXISTS validity_period integer DEFAULT 365, -- Days
ADD COLUMN IF NOT EXISTS ce_credits numeric(5,2) DEFAULT 0, -- CEUs or CPD points
ADD COLUMN IF NOT EXISTS cost_centre text,
ADD COLUMN IF NOT EXISTS pricing numeric(12,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS passing_criteria integer DEFAULT 70, -- Minimum percentage score
ADD COLUMN IF NOT EXISTS syllabus_url text,
ADD COLUMN IF NOT EXISTS version integer DEFAULT 1,
ADD COLUMN IF NOT EXISTS metadata jsonb;

-- 2. Create training_instructors registry
CREATE TABLE IF NOT EXISTS public.training_instructors (
    id SERIAL PRIMARY KEY,
    tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    name text NOT NULL,
    qualifications text,
    hourly_rate numeric(12,2) DEFAULT 0,
    rating numeric(3,2) DEFAULT 5.0,
    availability text DEFAULT 'Available', -- Available, Out of office, Fully booked
    created_at timestamptz DEFAULT now() NOT NULL
);

-- 3. Create training_sessions timetable
CREATE TABLE IF NOT EXISTS public.training_sessions (
    id SERIAL PRIMARY KEY,
    tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    program_id integer REFERENCES public.training_programs(id) ON DELETE CASCADE,
    trainer_id integer REFERENCES public.training_instructors(id) ON DELETE SET NULL,
    start_date timestamp with time zone NOT NULL,
    end_date timestamp with time zone NOT NULL,
    venue text, -- Classroom name or Virtual platform
    meeting_link text,
    capacity integer DEFAULT 20,
    waitlist_limit integer DEFAULT 5,
    registration_deadline timestamp with time zone,
    status text DEFAULT 'scheduled' NOT NULL, -- scheduled, in_progress, completed, cancelled
    created_at timestamptz DEFAULT now() NOT NULL
);

-- 4. Extend training_enrollments table with Session and Assessment parameters
ALTER TABLE public.training_enrollments
ADD COLUMN IF NOT EXISTS session_id integer REFERENCES public.training_sessions(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS nominated_by integer, -- references public.employees(id)
ADD COLUMN IF NOT EXISTS enrolment_type text DEFAULT 'self', -- self, manager, hr, automatic
ADD COLUMN IF NOT EXISTS assessment_score numeric(5,2),
ADD COLUMN IF NOT EXISTS certificate_url text,
ADD COLUMN IF NOT EXISTS expiry_date timestamp with time zone;

-- 5. Create competency_framework designations skill targets
CREATE TABLE IF NOT EXISTS public.competency_framework (
    id SERIAL PRIMARY KEY,
    tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    designation text NOT NULL,
    skill_name text NOT NULL,
    required_level text DEFAULT 'intermediate' NOT NULL, -- beginner, intermediate, advanced, expert
    created_at timestamptz DEFAULT now() NOT NULL,
    CONSTRAINT unique_designation_skill UNIQUE (tenant_id, designation, skill_name)
);

-- 6. Create training_assessments examination banks
CREATE TABLE IF NOT EXISTS public.training_assessments (
    id SERIAL PRIMARY KEY,
    tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    program_id integer REFERENCES public.training_programs(id) ON DELETE CASCADE,
    title text NOT NULL,
    duration_minutes integer DEFAULT 30,
    pass_percentage integer DEFAULT 70,
    questions jsonb NOT NULL, -- Array of questions
    created_at timestamptz DEFAULT now() NOT NULL
);

-- 7. Create training_attendance check-in register
CREATE TABLE IF NOT EXISTS public.training_attendance (
    id SERIAL PRIMARY KEY,
    tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    enrollment_id integer REFERENCES public.training_enrollments(id) ON DELETE CASCADE,
    session_id integer REFERENCES public.training_sessions(id) ON DELETE CASCADE,
    date date NOT NULL,
    status text DEFAULT 'present' NOT NULL, -- present, absent, excused
    checkin_gps_lat numeric(9,6),
    checkin_gps_long numeric(9,6),
    verification_method text DEFAULT 'manual', -- manual, qr_code, biometric, geolocation
    created_at timestamptz DEFAULT now() NOT NULL
);

-- 8. Create lms_audit_logs transaction registry
CREATE TABLE IF NOT EXISTS public.lms_audit_logs (
    id SERIAL PRIMARY KEY,
    tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    performed_by uuid NOT NULL,
    action text NOT NULL,
    details jsonb,
    created_at timestamptz DEFAULT now() NOT NULL
);

-- 9. Enable RLS on all newly created tables
ALTER TABLE public.training_instructors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.training_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.competency_framework ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.training_assessments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.training_attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lms_audit_logs ENABLE ROW LEVEL SECURITY;

-- 10. Implement RLS tenant isolation policies
CREATE POLICY tenant_isolation_policy ON public.training_instructors
    FOR ALL USING (tenant_id = ((auth.jwt() ->> 'tenant_id')::uuid));

CREATE POLICY tenant_isolation_policy ON public.training_sessions
    FOR ALL USING (tenant_id = ((auth.jwt() ->> 'tenant_id')::uuid));

CREATE POLICY tenant_isolation_policy ON public.competency_framework
    FOR ALL USING (tenant_id = ((auth.jwt() ->> 'tenant_id')::uuid));

CREATE POLICY tenant_isolation_policy ON public.training_assessments
    FOR ALL USING (tenant_id = ((auth.jwt() ->> 'tenant_id')::uuid));

CREATE POLICY tenant_isolation_policy ON public.training_attendance
    FOR ALL USING (tenant_id = ((auth.jwt() ->> 'tenant_id')::uuid));

CREATE POLICY tenant_isolation_policy ON public.lms_audit_logs
    FOR ALL USING (tenant_id = ((auth.jwt() ->> 'tenant_id')::uuid));
