-- Migration: Enterprise Finance & General Ledger Schema
-- Created: 2026-07-30

BEGIN;

-- 1. Chart of Accounts table
CREATE TABLE IF NOT EXISTS public.chart_of_accounts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  account_code VARCHAR(100) NOT NULL,
  account_name VARCHAR(255) NOT NULL,
  account_type VARCHAR(100) NOT NULL, -- Asset, Liability, Equity, Revenue, Expense
  currency VARCHAR(10) DEFAULT 'INR',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (tenant_id, account_code)
);

CREATE INDEX IF NOT EXISTS idx_coa_tenant_code ON public.chart_of_accounts(tenant_id, account_code);

-- Enable RLS
ALTER TABLE public.chart_of_accounts ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Tenant isolation for chart_of_accounts" ON public.chart_of_accounts;
CREATE POLICY "Tenant isolation for chart_of_accounts" ON public.chart_of_accounts
  USING (tenant_id = (SELECT tenant_id FROM public.users WHERE id = auth.uid()));


-- 2. Cost Centers table
CREATE TABLE IF NOT EXISTS public.cost_centers (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  code VARCHAR(100) NOT NULL,
  name VARCHAR(255) NOT NULL,
  manager_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
  budget_limit NUMERIC(15,4) DEFAULT 0.00,
  budget_spent NUMERIC(15,4) DEFAULT 0.00,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (tenant_id, code)
);

-- Enable RLS
ALTER TABLE public.cost_centers ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Tenant isolation for cost_centers" ON public.cost_centers;
CREATE POLICY "Tenant isolation for cost_centers" ON public.cost_centers
  USING (tenant_id = (SELECT tenant_id FROM public.users WHERE id = auth.uid()));


-- 3. General Ledger table
CREATE TABLE IF NOT EXISTS public.general_ledger (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  account_code VARCHAR(100) NOT NULL,
  cost_center_code VARCHAR(100),
  debit NUMERIC(15,4) NOT NULL DEFAULT 0.0000,
  credit NUMERIC(15,4) NOT NULL DEFAULT 0.0000,
  posting_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  ref_transaction_type VARCHAR(100) NOT NULL, -- Invoice, Claim, Payroll, Manual
  ref_transaction_id VARCHAR(100) NOT NULL,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_gl_posting ON public.general_ledger(tenant_id, posting_date);

-- Enable RLS
ALTER TABLE public.general_ledger ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Tenant isolation for general_ledger" ON public.general_ledger;
CREATE POLICY "Tenant isolation for general_ledger" ON public.general_ledger
  USING (tenant_id = (SELECT tenant_id FROM public.users WHERE id = auth.uid()));


-- 4. Journal Entries table
CREATE TABLE IF NOT EXISTS public.journal_entries (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  entry_number VARCHAR(100) NOT NULL,
  debit_account_code VARCHAR(100) NOT NULL,
  credit_account_code VARCHAR(100) NOT NULL,
  amount NUMERIC(15,4) NOT NULL DEFAULT 0.0000,
  posting_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  notes TEXT,
  status VARCHAR(50) DEFAULT 'Draft', -- Draft, Posted, Approved
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (tenant_id, entry_number)
);

-- Enable RLS
ALTER TABLE public.journal_entries ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Tenant isolation for journal_entries" ON public.journal_entries;
CREATE POLICY "Tenant isolation for journal_entries" ON public.journal_entries
  USING (tenant_id = (SELECT tenant_id FROM public.users WHERE id = auth.uid()));

COMMIT;
