-- ============================================================
-- SQL Schema Evolution: Invoice & Billing Settings
-- Date: 2026-07-25
-- ============================================================

-- Alter public.company_settings to add invoice configuration columns
ALTER TABLE public.company_settings ADD COLUMN IF NOT EXISTS invoice_prefix text DEFAULT 'TS-INV-';
ALTER TABLE public.company_settings ADD COLUMN IF NOT EXISTS invoice_number_start integer DEFAULT 1;
ALTER TABLE public.company_settings ADD COLUMN IF NOT EXISTS quotation_prefix text DEFAULT 'TS-QTN-';
ALTER TABLE public.company_settings ADD COLUMN IF NOT EXISTS purchase_prefix text DEFAULT 'TS-PO-';
ALTER TABLE public.company_settings ADD COLUMN IF NOT EXISTS credit_note_prefix text DEFAULT 'TS-CN-';
ALTER TABLE public.company_settings ADD COLUMN IF NOT EXISTS gst_enabled boolean DEFAULT false;
ALTER TABLE public.company_settings ADD COLUMN IF NOT EXISTS gst_rate_default numeric DEFAULT 18.00;
ALTER TABLE public.company_settings ADD COLUMN IF NOT EXISTS tax_configuration jsonb DEFAULT '[]'::jsonb;
ALTER TABLE public.company_settings ADD COLUMN IF NOT EXISTS invoice_decimal integer DEFAULT 2;
ALTER TABLE public.company_settings ADD COLUMN IF NOT EXISTS invoice_footer text DEFAULT 'Thank you for your business!';
ALTER TABLE public.company_settings ADD COLUMN IF NOT EXISTS invoice_terms text DEFAULT '1. Please pay within 15 days of invoice date. 2. Late payments incur a 1.5% fee.';
ALTER TABLE public.company_settings ADD COLUMN IF NOT EXISTS default_payment_terms text DEFAULT 'Net 15';
ALTER TABLE public.company_settings ADD COLUMN IF NOT EXISTS payment_gateway text DEFAULT 'stripe';
ALTER TABLE public.company_settings ADD COLUMN IF NOT EXISTS payment_gateway_config jsonb DEFAULT '{}'::jsonb;
ALTER TABLE public.company_settings ADD COLUMN IF NOT EXISTS qr_code_enabled boolean DEFAULT false;
ALTER TABLE public.company_settings ADD COLUMN IF NOT EXISTS qr_code_url text;
ALTER TABLE public.company_settings ADD COLUMN IF NOT EXISTS digital_signature_enabled boolean DEFAULT false;
ALTER TABLE public.company_settings ADD COLUMN IF NOT EXISTS digital_signature_url text;
ALTER TABLE public.company_settings ADD COLUMN IF NOT EXISTS invoice_template text DEFAULT 'modern';
ALTER TABLE public.company_settings ADD COLUMN IF NOT EXISTS multi_currency_enabled boolean DEFAULT false;
ALTER TABLE public.company_settings ADD COLUMN IF NOT EXISTS supported_currencies jsonb DEFAULT '[]'::jsonb;

-- Create public.tenant_subscriptions table
CREATE TABLE IF NOT EXISTS public.tenant_subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  plan_code text NOT NULL DEFAULT 'free',
  plan_name text NOT NULL DEFAULT 'Free Trial',
  status text NOT NULL DEFAULT 'active', -- active, suspended, past_due, canceled
  price_amount numeric(15,2) NOT NULL DEFAULT 0.00,
  currency text NOT NULL DEFAULT 'INR',
  billing_interval text NOT NULL DEFAULT 'monthly', -- monthly, yearly
  seats_limit integer NOT NULL DEFAULT 5,
  seats_used integer NOT NULL DEFAULT 1,
  storage_limit_gb numeric(15,2) NOT NULL DEFAULT 5.00,
  storage_used_gb numeric(15,2) NOT NULL DEFAULT 0.00,
  current_period_start timestamptz NOT NULL DEFAULT now(),
  current_period_end timestamptz NOT NULL DEFAULT (now() + interval '30 days'),
  cancel_at_period_end boolean NOT NULL DEFAULT false,
  payment_method_brand text,
  payment_method_last4 text,
  applied_coupon text,
  tax_id text, -- tenant billing GSTIN / tax ID
  billing_address jsonb DEFAULT '{}'::jsonb,
  addons jsonb DEFAULT '[]'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT tenant_subscriptions_tenant_id_key UNIQUE (tenant_id)
);

-- Create public.saas_invoices table
CREATE TABLE IF NOT EXISTS public.saas_invoices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  invoice_number text NOT NULL,
  amount numeric(15,2) NOT NULL,
  currency text NOT NULL DEFAULT 'INR',
  status text NOT NULL DEFAULT 'paid', -- paid, open, void, uncollectible
  billing_date date NOT NULL DEFAULT current_date,
  due_date date,
  pdf_url text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT saas_invoices_tenant_id_invoice_number_key UNIQUE (tenant_id, invoice_number)
);

-- Enable RLS
ALTER TABLE public.tenant_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.saas_invoices ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist to allow clean replay
DROP POLICY IF EXISTS tenant_subscriptions_tenant_isolation ON public.tenant_subscriptions;
DROP POLICY IF EXISTS tenant_subscriptions_service_role ON public.tenant_subscriptions;
DROP POLICY IF EXISTS saas_invoices_tenant_isolation ON public.saas_invoices;
DROP POLICY IF EXISTS saas_invoices_service_role ON public.saas_invoices;

-- Tenant Isolation Policies
CREATE POLICY tenant_subscriptions_tenant_isolation ON public.tenant_subscriptions
  FOR ALL USING (tenant_id = public.current_tenant_id()) WITH CHECK (tenant_id = public.current_tenant_id());

CREATE POLICY tenant_subscriptions_service_role ON public.tenant_subscriptions
  FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY saas_invoices_tenant_isolation ON public.saas_invoices
  FOR ALL USING (tenant_id = public.current_tenant_id()) WITH CHECK (tenant_id = public.current_tenant_id());

CREATE POLICY saas_invoices_service_role ON public.saas_invoices
  FOR ALL TO service_role USING (true) WITH CHECK (true);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_tenant_subscriptions_tenant ON public.tenant_subscriptions(tenant_id);
CREATE INDEX IF NOT EXISTS idx_saas_invoices_tenant ON public.saas_invoices(tenant_id);
