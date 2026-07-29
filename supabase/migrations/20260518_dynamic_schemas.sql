-- Create custom_entities table
create table if not exists public.custom_entities (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  name text not null,
  slug text not null,
  description text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (tenant_id, slug)
);

-- Create custom_fields table
create table if not exists public.custom_fields (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  entity_slug text not null, -- Can map to standard table names like 'users', 'tasks' or a custom_entities slug
  name text not null,
  type text not null check (type in ('text', 'number', 'boolean', 'date', 'json')),
  required boolean not null default false,
  default_value text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (tenant_id, entity_slug, name)
);

-- Create custom_entity_records table (stores custom entity data)
create table if not exists public.custom_entity_records (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  entity_slug text not null,
  data jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Create automation_workflows table
create table if not exists public.automation_workflows (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  name text not null,
  trigger_event text not null, -- e.g., 'task_completed', 'attendance_logged', 'lead_created'
  conditions jsonb not null default '[]'::jsonb,
  actions jsonb not null default '[]'::jsonb,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Enable Row-Level Security (RLS) on all new tables
alter table public.custom_entities enable row level security;
alter table public.custom_fields enable row level security;
alter table public.custom_entity_records enable row level security;
alter table public.automation_workflows enable row level security;

-- Apply Multi-Tenant Row-Level Security policies referencing current_tenant_id()
create policy custom_entities_tenant_isolation on public.custom_entities
  using (tenant_id = public.current_tenant_id())
  with check (tenant_id = public.current_tenant_id());

create policy custom_fields_tenant_isolation on public.custom_fields
  using (tenant_id = public.current_tenant_id())
  with check (tenant_id = public.current_tenant_id());

create policy custom_entity_records_tenant_isolation on public.custom_entity_records
  using (tenant_id = public.current_tenant_id())
  with check (tenant_id = public.current_tenant_id());

create policy automation_workflows_tenant_isolation on public.automation_workflows
  using (tenant_id = public.current_tenant_id())
  with check (tenant_id = public.current_tenant_id());
