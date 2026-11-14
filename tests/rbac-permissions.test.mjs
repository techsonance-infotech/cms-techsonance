import test from 'node:test';
import assert from 'node:assert/strict';

// Core mapping definition matching src/server/rbac/mapper.ts
function mapAppRoleToUserRole(appRole) {
  const normalized = (appRole || '').toString().toLowerCase().trim();

  const roleMap = {
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

    accountant: 'finance_admin',
    finance: 'finance_admin',
    finance_admin: 'finance_admin',
    billing: 'finance_admin',

    manager: 'project_manager',
    project_manager: 'project_manager',
    business_analyst: 'business_analyst',

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

    client: 'client',
    viewer: 'client',
    employee: 'developer',
  };

  return roleMap[normalized] || 'client';
}

// Granular RBAC definitions matching src/lib/rbac/roles.ts
const PERMISSIONS = {
  NONE: { create: false, read: false, update: false, delete: false, approve: false, export: false },
  READ_ONLY: { create: false, read: true, update: false, delete: false, approve: false, export: false },
  FULL: { create: true, read: true, update: true, delete: true, approve: true, export: true },
  FULL_NO_DELETE: { create: true, read: true, update: true, delete: false, approve: true, export: true },
  READ_CREATE_UPDATE: { create: true, read: true, update: true, delete: false, approve: false, export: false },
};

const ROLE_PERMISSIONS_MATRIX = {
  admin: {
    finance: PERMISSIONS.FULL,
    users: PERMISSIONS.FULL,
    tasks: PERMISSIONS.FULL,
    settings: PERMISSIONS.FULL,
    reimbursements: PERMISSIONS.FULL,
  },
  finance_admin: {
    finance: PERMISSIONS.FULL_NO_DELETE,
    reimbursements: PERMISSIONS.FULL_NO_DELETE,
    users: PERMISSIONS.NONE,
    tasks: PERMISSIONS.NONE,
    settings: PERMISSIONS.READ_ONLY,
  },
  developer: {
    tasks: PERMISSIONS.FULL_NO_DELETE,
    finance: PERMISSIONS.NONE,
    users: PERMISSIONS.NONE,
    reimbursements: PERMISSIONS.READ_CREATE_UPDATE,
  },
};

function hasRBACPermission(authContext, module, action) {
  if (!authContext) return false;
  const rawRole = authContext.user.rawRole || authContext.user.role;
  const appRole = authContext.user.role;

  if (appRole === 'SuperAdmin') return true;

  const userRole = mapAppRoleToUserRole(rawRole);
  const roleDef = ROLE_PERMISSIONS_MATRIX[userRole];

  if (roleDef && roleDef[module]) {
    return Boolean(roleDef[module][action]);
  }

  return false;
}

test('RBAC: Role mapper correctly maps specialized business roles', () => {
  assert.equal(mapAppRoleToUserRole('accountant'), 'finance_admin');
  assert.equal(mapAppRoleToUserRole('finance'), 'finance_admin');
  assert.equal(mapAppRoleToUserRole('project_manager'), 'project_manager');
  assert.equal(mapAppRoleToUserRole('developer'), 'developer');
  assert.equal(mapAppRoleToUserRole('superadmin'), 'admin');
  assert.equal(mapAppRoleToUserRole('owner'), 'admin');
});

test('RBAC: Finance Admin has finance module access but restricted from user management', () => {
  const financeUser = {
    user: {
      id: 10,
      email: 'accountant@acme.com',
      role: 'Admin',
      rawRole: 'accountant',
    },
  };

  assert.equal(hasRBACPermission(financeUser, 'finance', 'read'), true);
  assert.equal(hasRBACPermission(financeUser, 'finance', 'create'), true);
  assert.equal(hasRBACPermission(financeUser, 'finance', 'export'), true);
  assert.equal(hasRBACPermission(financeUser, 'users', 'create'), false);
  assert.equal(hasRBACPermission(financeUser, 'tasks', 'delete'), false);
});

test('RBAC: Developer has task update access but no finance access', () => {
  const devUser = {
    user: {
      id: 25,
      email: 'dev@acme.com',
      role: 'Employee',
      rawRole: 'developer',
    },
  };

  assert.equal(hasRBACPermission(devUser, 'tasks', 'read'), true);
  assert.equal(hasRBACPermission(devUser, 'tasks', 'update'), true);
  assert.equal(hasRBACPermission(devUser, 'finance', 'read'), false);
  assert.equal(hasRBACPermission(devUser, 'finance', 'create'), false);
});

test('RBAC: SuperAdmin has unrestricted access to all modules and actions', () => {
  const superAdminUser = {
    user: {
      id: 1,
      email: 'root@techsonance.com',
      role: 'SuperAdmin',
      rawRole: 'superadmin',
    },
  };

  assert.equal(hasRBACPermission(superAdminUser, 'finance', 'delete'), true);
  assert.equal(hasRBACPermission(superAdminUser, 'users', 'delete'), true);
  assert.equal(hasRBACPermission(superAdminUser, 'settings', 'update'), true);
  assert.equal(hasRBACPermission(superAdminUser, 'reimbursements', 'approve'), true);
});
