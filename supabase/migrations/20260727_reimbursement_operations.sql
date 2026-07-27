-- Migration for Enterprise Reimbursements & Expense Claims Engine
-- Relational Foreign Key Schema linked to public.tenants & public.users
-- Created: 2026-07-27

CREATE TABLE IF NOT EXISTS public.reimbursement_claims (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  claim_code VARCHAR(50) NOT NULL,
  category VARCHAR(100) NOT NULL DEFAULT 'Travel',
  -- Categories: 'Travel', 'Fuel', 'Food', 'Internet', 'Mobile', 'Medical', 'Training', 'Certification', 'Relocation', 'Office Supplies', 'Project Expenses', 'Client Expenses', 'Accommodation', 'Entertainment', 'Remote Work Allowance', 'Custom'
  title VARCHAR(255) NOT NULL,
  expense_date DATE NOT NULL,
  amount NUMERIC(12,2) NOT NULL DEFAULT 0.00,
  currency VARCHAR(10) DEFAULT 'USD',
  tax_amount NUMERIC(10,2) DEFAULT 0.00,
  gstin_vat_number VARCHAR(100),
  
  -- Project & Billable Status (Simplified)
  project_name VARCHAR(255) DEFAULT 'Enterprise SaaS Portal',
  is_billable BOOLEAN DEFAULT false,
  
  merchant_name VARCHAR(200),
  receipt_url TEXT,
  ocr_scanned BOOLEAN DEFAULT true,
  is_duplicate_flagged BOOLEAN DEFAULT false,
  fraud_risk_score VARCHAR(50) DEFAULT 'Low',
  budget_approved BOOLEAN DEFAULT true,
  status VARCHAR(50) NOT NULL DEFAULT 'Submitted',
  approver_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.reimbursement_batches (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  batch_code VARCHAR(50) NOT NULL,
  total_claims_count INTEGER DEFAULT 0,
  total_amount NUMERIC(12,2) DEFAULT 0.00,
  settled_at TIMESTAMPTZ DEFAULT NOW(),
  settled_by UUID REFERENCES public.users(id) ON DELETE SET NULL
);

-- Enable Row Level Security
ALTER TABLE public.reimbursement_claims ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reimbursement_batches ENABLE ROW LEVEL SECURITY;

-- Idempotent Tenant Isolation Policies
DROP POLICY IF EXISTS "Tenant isolation for reimbursement_claims" ON public.reimbursement_claims;
CREATE POLICY "Tenant isolation for reimbursement_claims" ON public.reimbursement_claims
  USING (tenant_id = (SELECT tenant_id FROM public.users WHERE id = auth.uid()));

DROP POLICY IF EXISTS "Tenant isolation for reimbursement_batches" ON public.reimbursement_batches;
CREATE POLICY "Tenant isolation for reimbursement_batches" ON public.reimbursement_batches
  USING (tenant_id = (SELECT tenant_id FROM public.users WHERE id = auth.uid()));
