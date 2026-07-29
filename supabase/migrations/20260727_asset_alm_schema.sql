-- Supabase Migration: Centralized Asset Lifecycle Management (ALM) Extended Schema
-- Created: 2026-07-27

-- 1. Extend the public.assets table with ALM specifications
ALTER TABLE public.assets 
ADD COLUMN IF NOT EXISTS mac_address text,
ADD COLUMN IF NOT EXISTS ip_address text,
ADD COLUMN IF NOT EXISTS imei_number text,
ADD COLUMN IF NOT EXISTS sim_iccid text,
ADD COLUMN IF NOT EXISTS purchase_cost numeric DEFAULT 0,
ADD COLUMN IF NOT EXISTS book_value numeric DEFAULT 0,
ADD COLUMN IF NOT EXISTS depreciation_method text DEFAULT 'straight_line',
ADD COLUMN IF NOT EXISTS depreciation_years integer DEFAULT 5,
ADD COLUMN IF NOT EXISTS warranty_start date,
ADD COLUMN IF NOT EXISTS amc_expiry date,
ADD COLUMN IF NOT EXISTS insurance_policy text,
ADD COLUMN IF NOT EXISTS warehouse_location text,
ADD COLUMN IF NOT EXISTS rack_location text,
ADD COLUMN IF NOT EXISTS operational_health_score integer DEFAULT 100,
ADD COLUMN IF NOT EXISTS battery_health integer DEFAULT 100;

-- 2. Create asset_maintenance_records table
CREATE TABLE IF NOT EXISTS public.asset_maintenance_records (
    id SERIAL PRIMARY KEY,
    tenant_id uuid NOT NULL,
    asset_id integer REFERENCES public.assets(id) ON DELETE CASCADE,
    scheduled_date date NOT NULL,
    completion_date date,
    maintenance_type text NOT NULL, -- preventive, corrective, emergency
    cost numeric NOT NULL DEFAULT 0,
    downtime_hours numeric NOT NULL DEFAULT 0,
    sla_status text DEFAULT 'met', -- met, breached
    details text,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. Create asset_audit_verifications table
CREATE TABLE IF NOT EXISTS public.asset_audit_verifications (
    id SERIAL PRIMARY KEY,
    tenant_id uuid NOT NULL,
    audit_date date NOT NULL,
    verified_by text NOT NULL,
    verified_count integer NOT NULL DEFAULT 0,
    discrepancy_count integer NOT NULL DEFAULT 0,
    audit_type text NOT NULL, -- scheduled, surprise
    notes text,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 4. Enable Row Level Security (RLS) policies
ALTER TABLE public.asset_maintenance_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.asset_audit_verifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY tenant_isolation_policy ON public.asset_maintenance_records
    FOR ALL USING (tenant_id = ((auth.jwt() ->> 'tenant_id')::uuid));

CREATE POLICY tenant_isolation_policy ON public.asset_audit_verifications
    FOR ALL USING (tenant_id = ((auth.jwt() ->> 'tenant_id')::uuid));
