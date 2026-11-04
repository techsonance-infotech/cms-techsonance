/**
 * RBAC Database Service
 * Handles fetching roles, permissions, and access control from Supabase
 * Programmatically backed by company_settings JSON configuration for reliability and multi-tenant isolation.
 */

import { SupabaseClient } from '@supabase/supabase-js';
import type { ModulePermissions } from '@/lib/rbac/types';
import { getSupabaseAdminClient } from '@/server/supabase/admin';

// In-memory cache for performance
const rbacCache = new Map<string, { data: any; timestamp: number }>();
const CACHE_TTL = 30 * 1000; // 30 seconds cache for speedy reads

function isCacheValid(timestamp: number): boolean {
  return Date.now() - timestamp < CACHE_TTL;
}

// System modules list matching requirements
export const SYSTEM_MODULES = [
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
] as const;

export const SYSTEM_ACTIONS = [
  'read', 'create', 'update', 'delete', 'approve', 'reject',
  'import', 'export', 'print', 'share', 'assign', 'archive', 'restore', 'ai_actions'
] as const;

export interface RoleConfig {
  id: string;
  role_key: string;
  name: string;
  description: string;
  category: string;
  level: number;
  is_active: boolean;
  is_core_role: boolean;
  permissions: Record<string, string[]>;
}

// 18 Default Enterprise Roles with their specifications
export function getInitialRBACRoles(): RoleConfig[] {
  const fullPerms: Record<string, string[]> = {};
  SYSTEM_MODULES.forEach(m => {
    fullPerms[m] = [...SYSTEM_ACTIONS];
  });

  return [
    {
      id: 'super_admin',
      role_key: 'super_admin',
      name: 'Super Administrator',
      description: 'Unrestricted access to the entire platform, all configurations, and global tenant settings.',
      category: 'administration',
      level: 100,
      is_active: true,
      is_core_role: true,
      permissions: fullPerms
    },
    {
      id: 'org_admin',
      role_key: 'org_admin',
      name: 'Organization Administrator',
      description: 'Full control over organization settings, workflows, and all modules except platform administration.',
      category: 'administration',
      level: 95,
      is_active: true,
      is_core_role: true,
      permissions: (() => {
        const p = { ...fullPerms };
        delete p.administration;
        return p;
      })()
    },
    {
      id: 'it_admin',
      role_key: 'it_admin',
      name: 'IT Administrator',
      description: 'Manages settings, users, dynamic permissions, cloud integrations, and system security.',
      category: 'administration',
      level: 90,
      is_active: true,
      is_core_role: true,
      permissions: {
        dashboard: ['read', 'print'],
        administration: [...SYSTEM_ACTIONS],
        security_compliance: [...SYSTEM_ACTIONS]
      }
    },
    {
      id: 'hr_admin',
      role_key: 'hr_admin',
      name: 'HR Administrator',
      description: 'Full access to workforce directory, ATS recruitment, employee movements, and training portals.',
      category: 'administration',
      level: 85,
      is_active: true,
      is_core_role: true,
      permissions: {
        dashboard: [...SYSTEM_ACTIONS],
        workforce_hub: [...SYSTEM_ACTIONS],
        recruitment: [...SYSTEM_ACTIONS],
        time_attendance: [...SYSTEM_ACTIONS],
        hr_operations: [...SYSTEM_ACTIONS],
        analytics_bi: ['read', 'export', 'print'],
        ai_hub: ['read', 'ai_actions']
      }
    },
    {
      id: 'finance_admin',
      role_key: 'finance_admin',
      name: 'Finance Administrator',
      description: 'Manages billing models, invoicing, reimbursements, ledger statements, and tax configuration.',
      category: 'administration',
      level: 85,
      is_active: true,
      is_core_role: true,
      permissions: {
        dashboard: [...SYSTEM_ACTIONS],
        finance_claims: [...SYSTEM_ACTIONS],
        analytics_bi: ['read', 'export'],
        projects_delivery: ['read']
      }
    },
    {
      id: 'sales_admin',
      role_key: 'sales_admin',
      name: 'Sales Administrator',
      description: 'Manages sales workflow pipelines, opportunities, and team-level CRM configurations.',
      category: 'business',
      level: 85,
      is_active: true,
      is_core_role: true,
      permissions: {
        dashboard: [...SYSTEM_ACTIONS],
        crm_sales: [...SYSTEM_ACTIONS],
        analytics_bi: ['read', 'export']
      }
    },
    {
      id: 'delivery_manager',
      role_key: 'delivery_manager',
      name: 'Delivery Manager',
      description: 'Monitors overall delivery KPIs, release schedules, resource capacities, and performance reports.',
      category: 'management',
      level: 80,
      is_active: true,
      is_core_role: true,
      permissions: {
        dashboard: ['read'],
        projects_delivery: ['read', 'share', 'assign', 'ai_actions'],
        analytics_bi: ['read']
      }
    },
    {
      id: 'project_manager',
      role_key: 'project_manager',
      name: 'Project Manager',
      description: 'Manages active projects, sprint plans, task lists, and tracks timesheet details.',
      category: 'management',
      level: 75,
      is_active: true,
      is_core_role: true,
      permissions: {
        dashboard: ['read'],
        projects_delivery: ['read', 'create', 'update', 'assign', 'share', 'print'],
        time_attendance: ['read', 'approve', 'reject']
      }
    },
    {
      id: 'operations_manager',
      role_key: 'operations_manager',
      name: 'Operations Manager',
      description: 'Manages visitor entry logs, service desk assignments, and compliance workflows.',
      category: 'management',
      level: 75,
      is_active: true,
      is_core_role: true,
      permissions: {
        dashboard: ['read'],
        hr_operations: ['read', 'create', 'update', 'approve', 'reject', 'assign']
      }
    },
    {
      id: 'team_lead',
      role_key: 'team_lead',
      name: 'Team Lead',
      description: 'Coordinates sprints, reviews schedules, and approves attendance logs.',
      category: 'management',
      level: 70,
      is_active: true,
      is_core_role: true,
      permissions: {
        dashboard: ['read'],
        projects_delivery: ['read', 'update', 'assign'],
        time_attendance: ['read', 'approve', 'reject']
      }
    },
    {
      id: 'auditor',
      role_key: 'auditor',
      name: 'Auditor / Compliance Officer',
      description: 'Read-only access to organizational ledgers, audit trail, and regulatory documents.',
      category: 'support',
      level: 70,
      is_active: true,
      is_core_role: true,
      permissions: {
        dashboard: ['read'],
        workforce_hub: ['read'],
        finance_claims: ['read'],
        security_compliance: ['read', 'print', 'share'],
        projects_delivery: ['read']
      }
    },
    {
      id: 'hr_exec',
      role_key: 'hr_exec',
      name: 'HR Executive',
      description: 'Maintains records, files requests, coordinates training sessions, and handles candidate tracking.',
      category: 'business',
      level: 60,
      is_active: true,
      is_core_role: true,
      permissions: {
        dashboard: ['read'],
        workforce_hub: ['read', 'create', 'update', 'print'],
        recruitment: ['read', 'create', 'update', 'assign'],
        time_attendance: ['read', 'create', 'update']
      }
    },
    {
      id: 'recruiter',
      role_key: 'recruiter',
      name: 'Recruiter',
      description: 'Maintains talent pool listings, resume screens, and schedules applicant interviews.',
      category: 'business',
      level: 60,
      is_active: true,
      is_core_role: true,
      permissions: {
        dashboard: ['read'],
        recruitment: ['read', 'create', 'update', 'print', 'share', 'assign', 'ai_actions']
      }
    },
    {
      id: 'finance_exec',
      role_key: 'finance_exec',
      name: 'Finance Executive',
      description: 'Reviews travel bills, logs billing files, and manages reimbursements.',
      category: 'business',
      level: 60,
      is_active: true,
      is_core_role: true,
      permissions: {
        dashboard: ['read'],
        finance_claims: ['read', 'create', 'update', 'print']
      }
    },
    {
      id: 'sales_exec',
      role_key: 'sales_exec',
      name: 'Sales Executive',
      description: 'Logs client contacts, updates pipelines, and creates quotes for assigned accounts.',
      category: 'business',
      level: 60,
      is_active: true,
      is_core_role: true,
      permissions: {
        dashboard: ['read'],
        crm_sales: ['read', 'create', 'update', 'print']
      }
    },
    {
      id: 'support_exec',
      role_key: 'support_exec',
      name: 'Support Executive',
      description: 'Manages system desks, tickets, and user problem requests.',
      category: 'support',
      level: 60,
      is_active: true,
      is_core_role: true,
      permissions: {
        dashboard: ['read'],
        hr_operations: ['read', 'create', 'update']
      }
    },
    {
      id: 'employee',
      role_key: 'employee',
      name: 'Employee',
      description: 'Personal self-service actions for leaves, WFH requests, timesheets, and training portal.',
      category: 'technical',
      level: 50,
      is_active: true,
      is_core_role: true,
      permissions: {
        dashboard: ['read'],
        workforce_hub: ['read'],
        time_attendance: ['read', 'create'],
        projects_delivery: ['read', 'create', 'update'],
        finance_claims: ['read', 'create'],
        hr_operations: ['read', 'create']
      }
    },
    {
      id: 'client',
      role_key: 'client',
      name: 'Client Portal User',
      description: 'Limited read/create access for viewing project milestones, quotes, and files.',
      category: 'client',
      level: 30,
      is_active: true,
      is_core_role: true,
      permissions: {
        dashboard: ['read'],
        projects_delivery: ['read', 'create'],
        crm_sales: ['read', 'create']
      }
    }
  ];
}

/**
 * Fetch tenant company_settings and get RBAC configuration.
 * Automatically initializes dynamic config if empty (self-healing).
 */
async function getOrInitRBACConfig(supabase: SupabaseClient, tenantId: string): Promise<{ roles: RoleConfig[] }> {
  const cacheKey = `rbac_${tenantId}`;
  const cached = rbacCache.get(cacheKey);
  if (cached && isCacheValid(cached.timestamp)) {
    return cached.data;
  }

  // Use the admin client to bypass any potential recursive RLS loops on company_settings
  const db = getSupabaseAdminClient();

  // Fetch company_settings
  const { data: settings, error } = await db
    .from('company_settings')
    .select('id, feature_flags')
    .eq('tenant_id', tenantId)
    .single();

  if (error || !settings) {
    console.error('[RBAC Service] Failed to fetch company settings:', error?.message);
    return { roles: getInitialRBACRoles() };
  }

  const featureFlags = settings.feature_flags || {};
  let rbac = featureFlags.rbac;

  if (!rbac || !rbac.roles || rbac.roles.length === 0) {
    // Self-heal: Seed defaults in JSON
    console.log(`[RBAC Service] Initializing default roles for tenant: ${tenantId}`);
    rbac = { roles: getInitialRBACRoles() };
    const updatedFlags = { ...featureFlags, rbac };

    await db
      .from('company_settings')
      .update({ feature_flags: updatedFlags })
      .eq('id', settings.id);
  }

  const result = rbac as { roles: RoleConfig[] };
  rbacCache.set(cacheKey, { data: result, timestamp: Date.now() });
  return result;
}

/**
 * Get all roles for a tenant
 */
export async function fetchRoles(supabase: SupabaseClient, tenantId: string): Promise<RoleConfig[]> {
  const config = await getOrInitRBACConfig(supabase, tenantId);
  return config.roles || [];
}

/**
 * Get specific role
 */
export async function fetchRole(supabase: SupabaseClient, tenantId: string, roleKey: string): Promise<RoleConfig | null> {
  const roles = await fetchRoles(supabase, tenantId);
  const normalizedKey = (roleKey || '').toLowerCase().replace(/[\s\-_]+/g, '');
  
  const match = roles.find(r => {
    const rKey = r.role_key.toLowerCase().replace(/[\s\-_]+/g, '');
    return rKey === normalizedKey || r.id === roleKey;
  });

  if (match) return match;

  // Fallback map for legacy roles
  if (normalizedKey === 'superadmin') return roles.find(r => r.role_key === 'super_admin') || null;
  if (normalizedKey === 'admin') return roles.find(r => r.role_key === 'org_admin') || null;
  if (normalizedKey === 'manager') return roles.find(r => r.role_key === 'project_manager') || null;
  if (normalizedKey === 'employee') return roles.find(r => r.role_key === 'employee') || null;
  if (normalizedKey === 'viewer') return roles.find(r => r.role_key === 'client') || null;

  return null;
}

/**
 * Get all permissions for a specific role
 */
export async function fetchRolePermissions(
  supabase: SupabaseClient,
  tenantId: string,
  roleId: string
): Promise<ModulePermissions | null> {
  const roles = await fetchRoles(supabase, tenantId);
  const role = roles.find(r => r.id === roleId || r.role_key === roleId);
  if (!role) return null;

  // Build standard ModulePermissions mapping matching frontend expectation
  const modulePerms: any = {};
  SYSTEM_MODULES.forEach(m => {
    modulePerms[m] = {
      create: false,
      read: false,
      update: false,
      delete: false,
      approve: false,
      export: false
    };
    
    const rawList = role.permissions ? role.permissions[m] : [];
    const actList: string[] = Array.isArray(rawList)
      ? rawList
      : (rawList && typeof rawList === 'object'
        ? Object.keys(rawList).filter(k => Boolean(rawList[k]))
        : []);
    // Map both standard and extended permissions
    actList.forEach(act => {
      if (act === 'read') modulePerms[m].read = true;
      if (act === 'create') modulePerms[m].create = true;
      if (act === 'update') modulePerms[m].update = true;
      if (act === 'delete') modulePerms[m].delete = true;
      if (act === 'approve') modulePerms[m].approve = true;
      if (act === 'export') modulePerms[m].export = true;
    });
  });

  return modulePerms as ModulePermissions;
}

/**
 * Check if a role can perform an action on a module
 */
export async function checkRolePermissionInDB(
  supabase: SupabaseClient,
  tenantId: string,
  roleKey: string,
  moduleName: string,
  action: string
): Promise<boolean> {
  const role = await fetchRole(supabase, tenantId, roleKey);
  if (!role) return false;

  // SuperAdmin gets everything automatically
  if (role.role_key === 'super_admin') return true;

  const rawActions = role.permissions ? role.permissions[moduleName] : [];
  const allowedActions: string[] = Array.isArray(rawActions)
    ? rawActions
    : (rawActions && typeof rawActions === 'object'
      ? Object.keys(rawActions).filter(k => Boolean(rawActions[k]))
      : []);
  return allowedActions.includes(action);
}

/**
 * Create a new custom role
 */
export async function createRole(
  supabase: SupabaseClient,
  tenantId: string,
  roleData: {
    role_key: string;
    name: string;
    description?: string;
    category: string;
    level: number;
    permissions?: Record<string, string[]>;
  }
) {
  const cacheKey = `rbac_${tenantId}`;
  const roles = await fetchRoles(supabase, tenantId);

  // Avoid duplicates
  if (roles.some(r => r.role_key === roleData.role_key)) {
    return null;
  }

  const newRole: RoleConfig = {
    id: roleData.role_key,
    role_key: roleData.role_key,
    name: roleData.name,
    description: roleData.description || '',
    category: roleData.category,
    level: roleData.level || 50,
    is_active: true,
    is_core_role: false,
    permissions: roleData.permissions || {}
  };

  const updatedRoles = [...roles, newRole];
  
  // Save back to settings
  const { data: settings } = await supabase
    .from('company_settings')
    .select('id, feature_flags')
    .eq('tenant_id', tenantId)
    .single();

  if (settings) {
    const featureFlags = settings.feature_flags || {};
    featureFlags.rbac = { roles: updatedRoles };

    await supabase
      .from('company_settings')
      .update({ feature_flags: featureFlags })
      .eq('id', settings.id);
  }

  rbacCache.delete(cacheKey);
  return newRole;
}

/**
 * Update an existing role mapping
 */
export async function updateRole(
  supabase: SupabaseClient,
  tenantId: string,
  roleId: string,
  roleData: Partial<RoleConfig>
) {
  const cacheKey = `rbac_${tenantId}`;
  const roles = await fetchRoles(supabase, tenantId);
  const roleIdx = roles.findIndex(r => r.id === roleId || r.role_key === roleId);
  if (roleIdx === -1) return null;

  roles[roleIdx] = {
    ...roles[roleIdx],
    ...roleData,
    permissions: roleData.permissions || roles[roleIdx].permissions
  };

  // Save back to settings
  const { data: settings } = await supabase
    .from('company_settings')
    .select('id, feature_flags')
    .eq('tenant_id', tenantId)
    .single();

  if (settings) {
    const featureFlags = settings.feature_flags || {};
    featureFlags.rbac = { roles };

    await supabase
      .from('company_settings')
      .update({ feature_flags: featureFlags })
      .eq('id', settings.id);
  }

  rbacCache.delete(cacheKey);
  return roles[roleIdx];
}

/**
 * Assign a permission action to a role
 */
export async function assignPermissionToRole(
  supabase: SupabaseClient,
  tenantId: string,
  roleId: string,
  moduleName: string,
  action: string
) {
  const role = await fetchRole(supabase, tenantId, roleId);
  if (!role) return null;

  const rawPerms = role.permissions ? role.permissions[moduleName] : [];
  const currentPerms: string[] = Array.isArray(rawPerms)
    ? [...rawPerms]
    : (rawPerms && typeof rawPerms === 'object'
      ? Object.keys(rawPerms).filter(k => Boolean(rawPerms[k]))
      : []);
  if (!currentPerms.includes(action)) {
    role.permissions[moduleName] = [...currentPerms, action];
    return await updateRole(supabase, tenantId, roleId, { permissions: role.permissions });
  }

  return role;
}

/**
 * Remove a permission action from a role
 */
export async function removePermissionFromRole(
  supabase: SupabaseClient,
  tenantId: string,
  roleId: string,
  moduleName: string,
  action: string
) {
  const role = await fetchRole(supabase, tenantId, roleId);
  if (!role) return false;

  const rawPerms = role.permissions ? role.permissions[moduleName] : [];
  const currentPerms: string[] = Array.isArray(rawPerms)
    ? [...rawPerms]
    : (rawPerms && typeof rawPerms === 'object'
      ? Object.keys(rawPerms).filter(k => Boolean(rawPerms[k]))
      : []);
  if (currentPerms.includes(action)) {
    role.permissions[moduleName] = currentPerms.filter(a => a !== action);
    await updateRole(supabase, tenantId, roleId, { permissions: role.permissions });
    return true;
  }

  return false;
}

/**
 * Implement manager-based reporting relationship verification.
 * Checks if targetUserId reports to managerUserId (directly or indirectly).
 */
export async function checkHierarchyAccess(
  supabase: SupabaseClient,
  tenantId: string,
  managerUserId: string,
  targetUserId: string
): Promise<boolean> {
  try {
    // 1. Get the manager's employee record
    const { data: managerEmp } = await supabase
      .from('employees')
      .select('id, department, designation')
      .eq('tenant_id', tenantId)
      .eq('user_id', managerUserId)
      .maybeSingle();

    if (!managerEmp) return false;

    // 2. Get the target employee record
    const { data: targetEmp } = await supabase
      .from('employees')
      .select('id, manager_id, department')
      .eq('tenant_id', tenantId)
      .eq('user_id', targetUserId)
      .maybeSingle();

    if (!targetEmp) return false;

    // Check direct manager relationship
    if (String(targetEmp.manager_id) === String(managerEmp.id)) {
      return true;
    }

    // Check department level inheritance (Department Heads)
    const isDeptHead = managerEmp.designation?.toLowerCase().includes('head') || 
                       managerEmp.designation?.toLowerCase().includes('director') || 
                       managerEmp.designation?.toLowerCase().includes('lead');
    if (isDeptHead && targetEmp.department === managerEmp.department) {
      return true;
    }

    // Recursive manager lookup check (indirect reporting up to 4 levels)
    let currentManagerId = targetEmp.manager_id;
    for (let depth = 0; depth < 4; depth++) {
      if (!currentManagerId) break;
      if (String(currentManagerId) === String(managerEmp.id)) {
        return true;
      }
      // Fetch next level manager
      const { data: parentMgr } = await supabase
        .from('employees')
        .select('manager_id')
        .eq('id', currentManagerId)
        .maybeSingle();
      
      currentManagerId = parentMgr?.manager_id || null;
    }

    return false;
  } catch (err) {
    console.error('[RBAC Service] Hierarchy check error:', err);
    return false;
  }
}

export function clearRBACCache(tenantId: string): void {
  rbacCache.delete(`rbac_${tenantId}`);
}

export function clearAllRBACCaches(): void {
  rbacCache.clear();
}
