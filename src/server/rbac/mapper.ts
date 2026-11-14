/**
 * RBAC Mapper - Maps between old AppRole system and new RBAC system
 * Provides backward compatibility while using the centralized RBAC
 */

import type { AppRole } from '@/server/auth/constants';
import type { UserRole } from '@/lib/rbac/types';

/**
 * Map old AppRole to new UserRole
 * @param appRole - Old AppRole (SuperAdmin, Admin, Manager, Employee, Viewer)
 * @returns New UserRole key
 */
export function mapAppRoleToUserRole(appRole: AppRole | string): UserRole {
  const normalized = (appRole || '').toString().toLowerCase().trim();

  const roleMap: Record<string, UserRole> = {
    // Admin / Executive
    superadmin: 'admin',
    super_admin: 'admin',
    admin: 'admin',
    owner: 'admin',
    business_owner: 'admin',
    tenant_owner: 'admin',
    management: 'admin',
    ceo: 'admin',
    cto: 'admin',
    director: 'admin',
    hr_manager: 'admin',

    // Finance / Accounting
    accountant: 'finance_admin',
    finance: 'finance_admin',
    finance_admin: 'finance_admin',
    billing: 'finance_admin',

    // Management
    manager: 'project_manager',
    project_manager: 'project_manager',
    business_analyst: 'business_analyst',

    // Technical & Creative
    developer: 'developer',
    engineer: 'developer',
    designer: 'designer',
    content_editor: 'content_editor',
    cms_administrator: 'content_editor',
    qa_tester: 'qa_tester',
    qa: 'qa_tester',
    devops_engineer: 'devops_engineer',
    devops: 'devops_engineer',
    support_team: 'support_team',
    support: 'support_team',

    // Client & Viewer
    client: 'client',
    viewer: 'client',
    employee: 'developer',
  };

  return roleMap[normalized] || 'client';
}

/**
 * Map new UserRole to old AppRole for backward compatibility
 * @param userRole - New UserRole
 * @returns Old AppRole
 */
export function mapUserRoleToAppRole(userRole: UserRole | string): AppRole {
  const roleMap: Record<string, AppRole> = {
    'admin': 'SuperAdmin',
    'project_manager': 'Manager',
    'developer': 'Employee',
    'designer': 'Employee',
    'content_editor': 'Employee',
    'qa_tester': 'Employee',
    'client': 'Viewer',
    'support_team': 'Employee',
    'devops_engineer': 'Employee',
    'business_analyst': 'Manager',
    'finance_admin': 'Manager',
  };

  return roleMap[userRole as string] || 'Employee';
}

/**
 * Get equivalent AppRoles for an old AppRole
 * Used when checking if a role has access to an action
 *
 * @param appRole - Old AppRole
 * @returns Array of AppRoles that have same or higher level
 */
export function getEquivalentAppRoles(appRole: AppRole): AppRole[] {
  const roleHierarchy: Record<AppRole, AppRole[]> = {
    'SuperAdmin': ['SuperAdmin'],
    'Admin': ['SuperAdmin', 'Admin'],
    'Manager': ['SuperAdmin', 'Admin', 'Manager'],
    'Employee': ['SuperAdmin', 'Admin', 'Manager', 'Employee'],
    'Viewer': ['SuperAdmin', 'Admin', 'Manager', 'Employee', 'Viewer'],
  };

  return roleHierarchy[appRole] || ['Viewer'];
}

/**
 * Check if role has at least the required level
 * @param currentRole - User's current role
 * @param requiredRoles - Required roles
 * @returns Boolean indicating if user has sufficient access
 */
export function hasRequiredRole(currentRole: AppRole | string, requiredRoles: AppRole[]): boolean {
  const normalized = currentRole as AppRole;
  return getEquivalentAppRoles(normalized).some(role => requiredRoles.includes(role));
}
