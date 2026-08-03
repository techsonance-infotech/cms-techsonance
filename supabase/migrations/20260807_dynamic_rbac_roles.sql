-- Migration: Centralized Hierarchical and Dynamic RBAC Configuration
-- Created: 2026-08-07

-- 1. Extend permission_action enum with new actions (must be done in separate transaction or individual statements)
ALTER TYPE public.permission_action ADD VALUE IF NOT EXISTS 'reject';
ALTER TYPE public.permission_action ADD VALUE IF NOT EXISTS 'import';
ALTER TYPE public.permission_action ADD VALUE IF NOT EXISTS 'print';
ALTER TYPE public.permission_action ADD VALUE IF NOT EXISTS 'share';
ALTER TYPE public.permission_action ADD VALUE IF NOT EXISTS 'assign';
ALTER TYPE public.permission_action ADD VALUE IF NOT EXISTS 'archive';
ALTER TYPE public.permission_action ADD VALUE IF NOT EXISTS 'restore';
ALTER TYPE public.permission_action ADD VALUE IF NOT EXISTS 'ai_actions';

-- 2. Seed default roles for existing tenants
do $$
declare
  v_tenant_id uuid;
begin
  for v_tenant_id in select id from public.tenants loop
    -- Seed default enterprise roles
    insert into public.roles (tenant_id, role_key, name, description, category, level, is_active, is_core_role)
    values
      -- Super Administrator
      (v_tenant_id, 'super_admin', 'Super Administrator', 'Unrestricted access to the entire platform, all tenants, and global configurations.', 'administration'::public.role_category, 100, true, true),
      -- Organization Administrator
      (v_tenant_id, 'org_admin', 'Organization Administrator', 'Full control over the organization tenant settings, modules, workflows, and operations.', 'administration'::public.role_category, 95, true, true),
      -- IT Administrator
      (v_tenant_id, 'it_admin', 'IT Administrator', 'Manages cloud storage, backup, API integrations, security configurations, and user management.', 'administration'::public.role_category, 90, true, true),
      -- HR Administrator
      (v_tenant_id, 'hr_admin', 'HR Administrator', 'Manages the complete employee lifecycle, onboarding, appraisals, recruitment, and HR settings.', 'administration'::public.role_category, 85, true, true),
      -- Finance Administrator
      (v_tenant_id, 'finance_admin', 'Finance Administrator', 'Manages billing, invoicing, salary structures, reimbursements, tax configurations, and financial audits.', 'administration'::public.role_category, 85, true, true),
      -- Sales Administrator
      (v_tenant_id, 'sales_admin', 'Sales Administrator', 'Manages client directory, pipeline configuration, CRM inbox, quotations, and sales analytics.', 'business'::public.role_category, 85, true, true),
      -- Delivery Manager
      (v_tenant_id, 'delivery_manager', 'Delivery Manager', 'Monitors overall delivery performance, sprint execution, resource scheduling, and portfolio health.', 'management'::public.role_category, 80, true, true),
      -- Project Manager
      (v_tenant_id, 'project_manager', 'Project Manager', 'Manages active projects, sprint plans, task boards, team resource planners, and timelines.', 'management'::public.role_category, 75, true, true),
      -- Operations Manager
      (v_tenant_id, 'operations_manager', 'Operations Manager', 'Manages service desk tickets, broadcast announcements, visitor passes, and operational compliance.', 'management'::public.role_category, 75, true, true),
      -- Team Lead
      (v_tenant_id, 'team_lead', 'Team Lead', 'Manages team assignments, reviews timesheets, and approves leaves/attendance for reports.', 'management'::public.role_category, 70, true, true),
      -- Auditor / Compliance Officer
      (v_tenant_id, 'auditor', 'Auditor / Compliance Officer', 'Read-only access to audit logs, compliance reports, financial records, and operational logs.', 'support'::public.role_category, 70, true, true),
      -- HR Executive
      (v_tenant_id, 'hr_exec', 'HR Executive', 'Handles day-to-day HR records, interviews, onboarding tasks, attendance, and candidate pipelines.', 'business'::public.role_category, 60, true, true),
      -- Recruiter
      (v_tenant_id, 'recruiter', 'Recruiter', 'Manages job postings, sources candidates, coordinates interviews, and designs offer letters.', 'business'::public.role_category, 60, true, true),
      -- Finance Executive
      (v_tenant_id, 'finance_exec', 'Finance Executive', 'Processes invoices, reimbursements, salary operations, expense trackers, and travel claims.', 'business'::public.role_category, 60, true, true),
      -- Sales Executive
      (v_tenant_id, 'sales_exec', 'Sales Executive', 'Manages client inquiries, contacts, follow-up meetings, quotations, and pipeline deals.', 'business'::public.role_category, 60, true, true),
      -- Support Executive
      (v_tenant_id, 'support_exec', 'Support Executive', 'Manages support tickets, service requests, and customer communications.', 'support'::public.role_category, 60, true, true),
      -- Employee
      (v_tenant_id, 'employee', 'Employee', 'Self-service portal for timesheets, leave applications, WFH status, personal tasks, and wellness.', 'technical'::public.role_category, 50, true, true),
      -- Client Portal User
      (v_tenant_id, 'client', 'Client Portal User', 'External access for viewing project milestones, invoices, quotes, contracts, and support.', 'client'::public.role_category, 30, true, true)
    on conflict (tenant_id, role_key) do update 
    set name = excluded.name, description = excluded.description, level = excluded.level;
  end loop;
end $$;

-- 3. Register system modules and dynamic permissions
do $$
declare
  v_tenant_id uuid;
  v_modules text[] := array[
    'dashboard',
    'workforce_hub',
    'recruitment',
    'time_attendance',
    'hr_operations',
    'projects_delivery',
    'finance_claims',
    'crm_sales',
    'analytics_bi',
    'ai_hub',
    'administration',
    'security_compliance'
  ];
  v_actions text[] := array[
    'read',
    'create',
    'update',
    'delete',
    'approve',
    'reject',
    'import',
    'export',
    'print',
    'share',
    'assign',
    'archive',
    'restore',
    'ai_actions'
  ];
  v_module text;
  v_action text;
begin
  for v_tenant_id in select id from public.tenants loop
    foreach v_module in array v_modules loop
      foreach v_action in array v_actions loop
        insert into public.permissions (tenant_id, module_name, permission_key, is_core_permission)
        values (v_tenant_id, v_module, v_module || '_' || v_action, true)
        on conflict (tenant_id, module_name, permission_key) do nothing;
      end loop;
    end loop;
  end loop;
end $$;

-- 4. Pre-populate role-to-permission mappings (dynamic seeds)
do $$
declare
  v_tenant_id uuid;
  v_role_id uuid;
  v_action_item text;
  v_modules text[];
  v_actions text[];
begin
  for v_tenant_id in select id from public.tenants loop
    -- 4a. Super Admin gets 100% of all permissions
    select id into v_role_id from public.roles where tenant_id = v_tenant_id and role_key = 'super_admin' limit 1;
    if v_role_id is not null then
      insert into public.role_permissions (tenant_id, role_id, permission_id, action)
      select v_tenant_id, v_role_id, p.id, act::public.permission_action
      from public.permissions p
      cross join (
        select unnest(array[
          'read', 'create', 'update', 'delete', 'approve', 'reject',
          'import', 'export', 'print', 'share', 'assign', 'archive', 'restore', 'ai_actions'
        ]) as act
      ) acts
      where p.tenant_id = v_tenant_id
      on conflict (tenant_id, role_id, permission_id, action) do nothing;
    end if;

    -- 4b. Org Admin gets all modules except 'administration'
    select id into v_role_id from public.roles where tenant_id = v_tenant_id and role_key = 'org_admin' limit 1;
    if v_role_id is not null then
      insert into public.role_permissions (tenant_id, role_id, permission_id, action)
      select v_tenant_id, v_role_id, p.id, act::public.permission_action
      from public.permissions p
      cross join (
        select unnest(array[
          'read', 'create', 'update', 'delete', 'approve', 'reject',
          'import', 'export', 'print', 'share', 'assign', 'archive', 'restore', 'ai_actions'
        ]) as act
      ) acts
      where p.tenant_id = v_tenant_id and p.module_name != 'administration'
      on conflict (tenant_id, role_id, permission_id, action) do nothing;
    end if;

    -- 4c. HR Admin gets workforce_hub, recruitment, time_attendance, hr_operations, analytics_bi, ai_hub, dashboard
    select id into v_role_id from public.roles where tenant_id = v_tenant_id and role_key = 'hr_admin' limit 1;
    if v_role_id is not null then
      insert into public.role_permissions (tenant_id, role_id, permission_id, action)
      select v_tenant_id, v_role_id, p.id, act::public.permission_action
      from public.permissions p
      cross join (
        select unnest(array[
          'read', 'create', 'update', 'delete', 'approve', 'reject',
          'import', 'export', 'print', 'share', 'assign', 'archive', 'restore', 'ai_actions'
        ]) as act
      ) acts
      where p.tenant_id = v_tenant_id and p.module_name in ('dashboard', 'workforce_hub', 'recruitment', 'time_attendance', 'hr_operations', 'analytics_bi', 'ai_hub')
      on conflict (tenant_id, role_id, permission_id, action) do nothing;
    end if;

    -- 4d. Finance Admin gets finance_claims, dashboard, analytics_bi, projects_delivery (restricted)
    select id into v_role_id from public.roles where tenant_id = v_tenant_id and role_key = 'finance_admin' limit 1;
    if v_role_id is not null then
      insert into public.role_permissions (tenant_id, role_id, permission_id, action)
      select v_tenant_id, v_role_id, p.id, act::public.permission_action
      from public.permissions p
      cross join (
        select unnest(array[
          'read', 'create', 'update', 'delete', 'approve', 'reject',
          'import', 'export', 'print', 'share', 'assign', 'archive', 'restore', 'ai_actions'
        ]) as act
      ) acts
      where p.tenant_id = v_tenant_id and p.module_name in ('dashboard', 'finance_claims', 'analytics_bi', 'projects_delivery')
      on conflict (tenant_id, role_id, permission_id, action) do nothing;
    end if;

    -- 4e. Recruiter gets recruitment module permissions
    select id into v_role_id from public.roles where tenant_id = v_tenant_id and role_key = 'recruiter' limit 1;
    if v_role_id is not null then
      insert into public.role_permissions (tenant_id, role_id, permission_id, action)
      select v_tenant_id, v_role_id, p.id, act::public.permission_action
      from public.permissions p
      cross join (
        select unnest(array['read', 'create', 'update', 'print', 'share', 'assign', 'ai_actions']) as act
      ) acts
      where p.tenant_id = v_tenant_id and p.module_name in ('dashboard', 'recruitment')
      on conflict (tenant_id, role_id, permission_id, action) do nothing;
    end if;

    -- 4f. Team Lead gets read/approve/reject/assign permissions
    select id into v_role_id from public.roles where tenant_id = v_tenant_id and role_key = 'team_lead' limit 1;
    if v_role_id is not null then
      insert into public.role_permissions (tenant_id, role_id, permission_id, action)
      select v_tenant_id, v_role_id, p.id, act::public.permission_action
      from public.permissions p
      cross join (
        select unnest(array['read', 'update', 'approve', 'reject', 'assign', 'share']) as act
      ) acts
      where p.tenant_id = v_tenant_id and p.module_name in ('dashboard', 'workforce_hub', 'time_attendance', 'projects_delivery')
      on conflict (tenant_id, role_id, permission_id, action) do nothing;
    end if;

    -- 4g. Employee gets self-service read/create (requests)
    select id into v_role_id from public.roles where tenant_id = v_tenant_id and role_key = 'employee' limit 1;
    if v_role_id is not null then
      insert into public.role_permissions (tenant_id, role_id, permission_id, action)
      select v_tenant_id, v_role_id, p.id, act::public.permission_action
      from public.permissions p
      cross join (
        select unnest(array['read', 'create', 'update']) as act
      ) acts
      where p.tenant_id = v_tenant_id and p.module_name in ('dashboard', 'time_attendance', 'hr_operations', 'projects_delivery', 'finance_claims')
      on conflict (tenant_id, role_id, permission_id, action) do nothing;
    end if;
  end loop;
end $$;
