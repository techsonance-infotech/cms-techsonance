import { ForbiddenError } from '@/server/http/errors';
import { ROLE_HIERARCHY, type AppRole } from '@/server/auth/constants';

export function normalizeAppRole(role: string | null | undefined): AppRole {
  switch ((role ?? '').toLowerCase()) {
    case 'superadmin':
    case 'super_admin':
      return 'SuperAdmin';
    case 'admin':
    case 'owner':
    case 'business_owner':
    case 'tenant_owner':
    case 'hr_manager':
    case 'hr_executive':
    case 'cms_administrator':
    case 'management':
    case 'ceo':
    case 'cto':
    case 'director':
    case 'accountant':
    case 'finance':
      return 'Admin';
    case 'manager':
    case 'project_manager':
      return 'Manager';
    case 'viewer':
    case 'client':
      return 'Viewer';
    default:
      return 'Employee';
  }
}

export function requireRole(actualRole: AppRole, allowedRoles: AppRole[]) {
  const actualRank = ROLE_HIERARCHY[actualRole];
  const allowed = allowedRoles.some((role) => actualRank >= ROLE_HIERARCHY[role]);

  if (!allowed) {
    throw new ForbiddenError('You do not have permission to access this resource');
  }
}

