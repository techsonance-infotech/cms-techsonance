-- ============================================================
-- TechSonance CMS — Employee Lifecycle Management (ELM)
-- Supabase SQL Migration: Phase 1 — Schema Evolution
-- Run this in Supabase SQL Editor (Dashboard > SQL Editor)
-- ============================================================

-- ========================
-- 1. EXTEND employees TABLE
-- ========================

-- Personal Information extensions
ALTER TABLE employees ADD COLUMN IF NOT EXISTS preferred_name TEXT;
ALTER TABLE employees ADD COLUMN IF NOT EXISTS alternate_phone TEXT;
ALTER TABLE employees ADD COLUMN IF NOT EXISTS religion TEXT;
ALTER TABLE employees ADD COLUMN IF NOT EXISTS passport_number TEXT;
ALTER TABLE employees ADD COLUMN IF NOT EXISTS driving_license TEXT;
ALTER TABLE employees ADD COLUMN IF NOT EXISTS photo_url TEXT;
ALTER TABLE employees ADD COLUMN IF NOT EXISTS current_address TEXT;
ALTER TABLE employees ADD COLUMN IF NOT EXISTS permanent_address TEXT;

-- Organization Information extensions
ALTER TABLE employees ADD COLUMN IF NOT EXISTS company TEXT;
ALTER TABLE employees ADD COLUMN IF NOT EXISTS business_unit TEXT;
ALTER TABLE employees ADD COLUMN IF NOT EXISTS sub_department TEXT;
ALTER TABLE employees ADD COLUMN IF NOT EXISTS division TEXT;
ALTER TABLE employees ADD COLUMN IF NOT EXISTS cost_center TEXT;
ALTER TABLE employees ADD COLUMN IF NOT EXISTS office TEXT;
ALTER TABLE employees ADD COLUMN IF NOT EXISTS floor TEXT;
ALTER TABLE employees ADD COLUMN IF NOT EXISTS cabin TEXT;
ALTER TABLE employees ADD COLUMN IF NOT EXISTS functional_manager_id UUID REFERENCES auth.users(id);
ALTER TABLE employees ADD COLUMN IF NOT EXISTS hr_manager_id UUID REFERENCES auth.users(id);
ALTER TABLE employees ADD COLUMN IF NOT EXISTS mentor_id UUID REFERENCES auth.users(id);
ALTER TABLE employees ADD COLUMN IF NOT EXISTS buddy_id UUID REFERENCES auth.users(id);
ALTER TABLE employees ADD COLUMN IF NOT EXISTS employee_category TEXT;
ALTER TABLE employees ADD COLUMN IF NOT EXISTS grade TEXT;
ALTER TABLE employees ADD COLUMN IF NOT EXISTS band TEXT;
ALTER TABLE employees ADD COLUMN IF NOT EXISTS job_family TEXT;
ALTER TABLE employees ADD COLUMN IF NOT EXISTS job_level TEXT;
ALTER TABLE employees ADD COLUMN IF NOT EXISTS weekly_off TEXT DEFAULT 'Saturday,Sunday';
ALTER TABLE employees ADD COLUMN IF NOT EXISTS work_mode TEXT DEFAULT 'office' CHECK (work_mode IN ('office', 'remote', 'hybrid'));
ALTER TABLE employees ADD COLUMN IF NOT EXISTS exit_date DATE;
ALTER TABLE employees ADD COLUMN IF NOT EXISTS last_working_day DATE;

-- Payroll extensions
ALTER TABLE employees ADD COLUMN IF NOT EXISTS professional_tax NUMERIC(12,2);
ALTER TABLE employees ADD COLUMN IF NOT EXISTS lwf NUMERIC(12,2);
ALTER TABLE employees ADD COLUMN IF NOT EXISTS gratuity NUMERIC(12,2);
ALTER TABLE employees ADD COLUMN IF NOT EXISTS bonus NUMERIC(12,2);
ALTER TABLE employees ADD COLUMN IF NOT EXISTS variable_pay NUMERIC(12,2);
ALTER TABLE employees ADD COLUMN IF NOT EXISTS stock_options TEXT;
ALTER TABLE employees ADD COLUMN IF NOT EXISTS tax_regime TEXT DEFAULT 'new' CHECK (tax_regime IN ('old', 'new'));
ALTER TABLE employees ADD COLUMN IF NOT EXISTS allowances JSONB DEFAULT '{}';
ALTER TABLE employees ADD COLUMN IF NOT EXISTS reimbursement_config JSONB DEFAULT '{}';
ALTER TABLE employees ADD COLUMN IF NOT EXISTS salary_revision_history JSONB DEFAULT '[]';

-- ========================
-- 2. EMPLOYEE ASSETS TABLE
-- ========================
CREATE TABLE IF NOT EXISTS employee_assets (
  id BIGSERIAL PRIMARY KEY,
  tenant_id UUID NOT NULL,
  employee_id BIGINT NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  asset_type TEXT NOT NULL CHECK (asset_type IN (
    'laptop', 'desktop', 'mac', 'monitor', 'mouse', 'keyboard',
    'mobile', 'sim', 'id_card', 'access_card', 'parking_pass',
    'locker', 'headset', 'dock', 'other'
  )),
  asset_name TEXT NOT NULL,
  serial_number TEXT,
  brand TEXT,
  model TEXT,
  specification TEXT,
  issue_date DATE,
  return_date DATE,
  condition TEXT DEFAULT 'good' CHECK (condition IN ('new', 'good', 'fair', 'damaged', 'lost')),
  warranty_expiry DATE,
  status TEXT DEFAULT 'issued' CHECK (status IN ('issued', 'returned', 'lost', 'damaged', 'under_repair')),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_employee_assets_tenant ON employee_assets(tenant_id);
CREATE INDEX IF NOT EXISTS idx_employee_assets_employee ON employee_assets(employee_id);

ALTER TABLE employee_assets ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Tenant isolation for employee_assets" ON employee_assets
  FOR ALL USING (tenant_id = current_setting('app.tenant_id', true)::uuid);

-- ========================
-- 3. EMPLOYEE SKILLS TABLE
-- ========================
CREATE TABLE IF NOT EXISTS employee_skills (
  id BIGSERIAL PRIMARY KEY,
  tenant_id UUID NOT NULL,
  employee_id BIGINT NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  skill_name TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN (
    'programming', 'framework', 'language', 'cloud', 'devops',
    'design', 'soft_skill', 'certification', 'database', 'tools', 'other'
  )),
  proficiency_level TEXT DEFAULT 'intermediate' CHECK (proficiency_level IN (
    'beginner', 'intermediate', 'advanced', 'expert'
  )),
  years_experience NUMERIC(4,1) DEFAULT 0,
  certified BOOLEAN DEFAULT false,
  assessment_score NUMERIC(5,2),
  last_assessed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_employee_skills_tenant ON employee_skills(tenant_id);
CREATE INDEX IF NOT EXISTS idx_employee_skills_employee ON employee_skills(employee_id);
CREATE INDEX IF NOT EXISTS idx_employee_skills_category ON employee_skills(category);

ALTER TABLE employee_skills ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Tenant isolation for employee_skills" ON employee_skills
  FOR ALL USING (tenant_id = current_setting('app.tenant_id', true)::uuid);

-- ==========================
-- 4. EMPLOYEE TRAINING TABLE
-- ==========================
CREATE TABLE IF NOT EXISTS employee_training (
  id BIGSERIAL PRIMARY KEY,
  tenant_id UUID NOT NULL,
  employee_id BIGINT NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  course_name TEXT NOT NULL,
  provider TEXT,
  training_type TEXT DEFAULT 'external' CHECK (training_type IN (
    'internal', 'external', 'compliance', 'certification', 'workshop', 'conference'
  )),
  start_date DATE,
  end_date DATE,
  status TEXT DEFAULT 'pending' CHECK (status IN (
    'pending', 'in_progress', 'completed', 'expired', 'cancelled'
  )),
  score NUMERIC(5,2),
  certificate_url TEXT,
  expiry_date DATE,
  cost NUMERIC(12,2),
  currency TEXT DEFAULT 'INR',
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_employee_training_tenant ON employee_training(tenant_id);
CREATE INDEX IF NOT EXISTS idx_employee_training_employee ON employee_training(employee_id);

ALTER TABLE employee_training ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Tenant isolation for employee_training" ON employee_training
  FOR ALL USING (tenant_id = current_setting('app.tenant_id', true)::uuid);

-- ==========================
-- 5. EMPLOYEE TIMELINE TABLE
-- ==========================
CREATE TABLE IF NOT EXISTS employee_timeline (
  id BIGSERIAL PRIMARY KEY,
  tenant_id UUID NOT NULL,
  employee_id BIGINT NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL CHECK (event_type IN (
    'joined', 'promotion', 'transfer', 'salary_revision',
    'leave_applied', 'leave_approved', 'leave_rejected',
    'attendance_marked', 'performance_review',
    'warning', 'training_completed', 'document_uploaded',
    'login', 'password_reset', 'role_changed',
    'project_assigned', 'project_removed',
    'asset_issued', 'asset_returned',
    'resigned', 'terminated', 'exit_completed',
    'skill_added', 'certification_earned',
    'manager_changed', 'department_changed',
    'note_added', 'status_changed', 'other'
  )),
  event_title TEXT NOT NULL,
  event_description TEXT,
  event_data JSONB DEFAULT '{}',
  triggered_by UUID,  -- auth user id who triggered this
  ip_address TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_employee_timeline_tenant ON employee_timeline(tenant_id);
CREATE INDEX IF NOT EXISTS idx_employee_timeline_employee ON employee_timeline(employee_id);
CREATE INDEX IF NOT EXISTS idx_employee_timeline_type ON employee_timeline(event_type);
CREATE INDEX IF NOT EXISTS idx_employee_timeline_created ON employee_timeline(created_at DESC);

ALTER TABLE employee_timeline ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Tenant isolation for employee_timeline" ON employee_timeline
  FOR ALL USING (tenant_id = current_setting('app.tenant_id', true)::uuid);

-- ========================
-- 6. EMPLOYEE NOTES TABLE
-- ========================
CREATE TABLE IF NOT EXISTS employee_notes (
  id BIGSERIAL PRIMARY KEY,
  tenant_id UUID NOT NULL,
  employee_id BIGINT NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  note_type TEXT NOT NULL DEFAULT 'general' CHECK (note_type IN (
    'general', 'hr_private', 'manager_note', 'achievement', 'award',
    'incident', 'warning', 'compliment', 'feedback', 'disciplinary'
  )),
  title TEXT,
  content TEXT NOT NULL,
  visibility TEXT DEFAULT 'private' CHECK (visibility IN ('private', 'manager', 'hr', 'public')),
  created_by UUID NOT NULL,
  updated_by UUID,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_employee_notes_tenant ON employee_notes(tenant_id);
CREATE INDEX IF NOT EXISTS idx_employee_notes_employee ON employee_notes(employee_id);
CREATE INDEX IF NOT EXISTS idx_employee_notes_type ON employee_notes(note_type);

ALTER TABLE employee_notes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Tenant isolation for employee_notes" ON employee_notes
  FOR ALL USING (tenant_id = current_setting('app.tenant_id', true)::uuid);

-- ============================
-- 7. EMPLOYEE DOCUMENTS TABLE
-- ============================
CREATE TABLE IF NOT EXISTS employee_documents (
  id BIGSERIAL PRIMARY KEY,
  tenant_id UUID NOT NULL,
  employee_id BIGINT NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  document_type TEXT NOT NULL CHECK (document_type IN (
    'resume', 'offer_letter', 'appointment_letter', 'nda',
    'employment_contract', 'pan_card', 'aadhaar_card',
    'passport', 'driving_license', 'visa',
    'education_certificate', 'experience_certificate',
    'salary_slip', 'relieving_letter', 'promotion_letter',
    'certificate', 'medical_report', 'background_verification',
    'police_verification', 'training_certificate', 'other'
  )),
  document_name TEXT NOT NULL,
  file_url TEXT NOT NULL,
  file_size BIGINT,
  file_type TEXT,
  storage_provider TEXT DEFAULT 'supabase' CHECK (storage_provider IN ('supabase', 's3', 'cloudinary')),
  uploaded_by UUID NOT NULL,
  verified BOOLEAN DEFAULT false,
  verified_by UUID,
  verified_at TIMESTAMPTZ,
  expiry_date DATE,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_employee_documents_tenant ON employee_documents(tenant_id);
CREATE INDEX IF NOT EXISTS idx_employee_documents_employee ON employee_documents(employee_id);
CREATE INDEX IF NOT EXISTS idx_employee_documents_type ON employee_documents(document_type);

ALTER TABLE employee_documents ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Tenant isolation for employee_documents" ON employee_documents
  FOR ALL USING (tenant_id = current_setting('app.tenant_id', true)::uuid);

-- ============================
-- 8. ORG CHART TABLE
-- ============================
CREATE TABLE IF NOT EXISTS org_chart (
  id BIGSERIAL PRIMARY KEY,
  tenant_id UUID NOT NULL,
  employee_id BIGINT NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  parent_employee_id BIGINT REFERENCES employees(id) ON DELETE SET NULL,
  position_title TEXT,
  level INTEGER DEFAULT 0,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(tenant_id, employee_id)
);

CREATE INDEX IF NOT EXISTS idx_org_chart_tenant ON org_chart(tenant_id);
CREATE INDEX IF NOT EXISTS idx_org_chart_parent ON org_chart(parent_employee_id);

ALTER TABLE org_chart ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Tenant isolation for org_chart" ON org_chart
  FOR ALL USING (tenant_id = current_setting('app.tenant_id', true)::uuid);

-- ============================
-- 9. AUDIT LOGS TABLE
-- ============================
CREATE TABLE IF NOT EXISTS employee_audit_logs (
  id BIGSERIAL PRIMARY KEY,
  tenant_id UUID NOT NULL,
  employee_id BIGINT REFERENCES employees(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id BIGINT,
  old_values JSONB,
  new_values JSONB,
  performed_by UUID NOT NULL,
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_audit_logs_tenant ON employee_audit_logs(tenant_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_employee ON employee_audit_logs(employee_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON employee_audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created ON employee_audit_logs(created_at DESC);

ALTER TABLE employee_audit_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Tenant isolation for employee_audit_logs" ON employee_audit_logs
  FOR ALL USING (tenant_id = current_setting('app.tenant_id', true)::uuid);

-- ============================
-- 10. REVIEW CYCLES TABLE
-- ============================
CREATE TABLE IF NOT EXISTS review_cycles (
  id BIGSERIAL PRIMARY KEY,
  tenant_id UUID NOT NULL,
  name TEXT NOT NULL,
  review_type TEXT NOT NULL CHECK (review_type IN (
    'quarterly', 'half_yearly', 'yearly', 'monthly',
    'weekly_one_on_one', 'probation', 'exit',
    'promotion', 'peer', 'manager', 'self', '360_degree'
  )),
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'completed', 'cancelled')),
  created_by UUID NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_review_cycles_tenant ON review_cycles(tenant_id);

ALTER TABLE review_cycles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Tenant isolation for review_cycles" ON review_cycles
  FOR ALL USING (tenant_id = current_setting('app.tenant_id', true)::uuid);

-- ============================
-- 11. EMPLOYEE REVIEWS TABLE
-- ============================
CREATE TABLE IF NOT EXISTS employee_reviews (
  id BIGSERIAL PRIMARY KEY,
  tenant_id UUID NOT NULL,
  cycle_id BIGINT REFERENCES review_cycles(id) ON DELETE CASCADE,
  employee_id BIGINT NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  reviewer_id BIGINT REFERENCES employees(id) ON DELETE SET NULL,
  review_type TEXT NOT NULL,
  goals JSONB DEFAULT '[]',
  kpis JSONB DEFAULT '[]',
  kras JSONB DEFAULT '[]',
  okrs JSONB DEFAULT '[]',
  self_rating NUMERIC(3,1),
  manager_rating NUMERIC(3,1),
  final_rating NUMERIC(3,1),
  strengths TEXT,
  improvements TEXT,
  comments TEXT,
  promotion_eligible BOOLEAN DEFAULT false,
  training_recommendations JSONB DEFAULT '[]',
  status TEXT DEFAULT 'pending' CHECK (status IN (
    'pending', 'self_review', 'manager_review', 'completed', 'acknowledged'
  )),
  submitted_at TIMESTAMPTZ,
  reviewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_employee_reviews_tenant ON employee_reviews(tenant_id);
CREATE INDEX IF NOT EXISTS idx_employee_reviews_employee ON employee_reviews(employee_id);
CREATE INDEX IF NOT EXISTS idx_employee_reviews_cycle ON employee_reviews(cycle_id);

ALTER TABLE employee_reviews ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Tenant isolation for employee_reviews" ON employee_reviews
  FOR ALL USING (tenant_id = current_setting('app.tenant_id', true)::uuid);
