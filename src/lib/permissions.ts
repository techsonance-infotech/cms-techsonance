/**
 * Role-based Access Control (RBAC) Utility
 * Defines permissions for different user roles in the system
 */

export type UserRole =
  | 'super_admin'
  | 'admin'
  | 'owner'
  | 'ceo'
  | 'cto'
  | 'director'
  | 'hr_manager'
  | 'hr_executive'
  | 'finance'
  | 'accountant'
  | 'cms_administrator'
  | 'manager'
  | 'project_manager'
  | 'business_development'
  | 'developer'
  | 'employee'
  | 'freelancer'
  | 'contractor'
  | 'auditor'
  | 'frontend_developer'
  | 'backend_developer'
  | 'fullstack_developer'
  | 'mobile_developer'
  | 'qa_engineer'
  | 'devops_engineer'
  | 'ui_ux_designer'
  | 'digital_marketing'
  | 'business_analyst'
  | 'management'
  | 'intern'
  | 'architect'
  | 'client';

export interface Permission {
  canView: boolean;
  canCreate: boolean;
  canEdit: boolean;
  canDelete: boolean;
  canApprove?: boolean;
}

export interface RolePermissions {
  dashboard: Permission;
  clients: Permission;
  projects: Permission;
  team: Permission;
  finance: Permission;
  content: Permission;
  settings: Permission;
  dailyUpdate: Permission;
  myAccount: Permission;
  helpDesk: Permission;
  inquiry: Permission;
  tasks: Permission;
  reimbursements: Permission;
}

const defaultPermission: Permission = {
  canView: false,
  canCreate: false,
  canEdit: false,
  canDelete: false,
  canApprove: false,
};

const fullAccess: Permission = {
  canView: true,
  canCreate: true,
  canEdit: true,
  canDelete: true,
  canApprove: true,
};

const viewOnly: Permission = {
  canView: true,
  canCreate: false,
  canEdit: false,
  canDelete: false,
  canApprove: false,
};

const viewAndCreate: Permission = {
  canView: true,
  canCreate: true,
  canEdit: false,
  canDelete: false,
  canApprove: false,
};

const viewEditCreate: Permission = {
  canView: true,
  canCreate: true,
  canEdit: true,
  canDelete: false,
  canApprove: false,
};

/**
 * Role Permission Matrix
 */
export const rolePermissions: Record<UserRole, RolePermissions> = {
  // Super Admin - Ultimate access
  super_admin: {
    dashboard: fullAccess,
    clients: fullAccess,
    projects: fullAccess,
    team: fullAccess,
    finance: fullAccess,
    content: fullAccess,
    settings: fullAccess,
    dailyUpdate: fullAccess,
    myAccount: fullAccess,
    helpDesk: fullAccess,
    inquiry: fullAccess,
    tasks: fullAccess,
    reimbursements: fullAccess,
  },

  // Owner - Business/Tenant Owner, full access (assigned at registration)
  owner: {
    dashboard: fullAccess,
    clients: fullAccess,
    projects: fullAccess,
    team: fullAccess,
    finance: fullAccess,
    content: fullAccess,
    settings: fullAccess,
    dailyUpdate: fullAccess,
    myAccount: fullAccess,
    helpDesk: fullAccess,
    inquiry: fullAccess,
    tasks: fullAccess,
    reimbursements: fullAccess,
  },

  // Admin - Full access to everything
  admin: {
    dashboard: fullAccess,
    clients: fullAccess,
    projects: fullAccess,
    team: fullAccess,
    finance: fullAccess,
    content: fullAccess,
    settings: fullAccess,
    dailyUpdate: fullAccess,
    myAccount: fullAccess,
    helpDesk: fullAccess,
    inquiry: fullAccess,
    tasks: fullAccess,
    reimbursements: fullAccess,
  },

  // CEO - Full access
  ceo: {
    dashboard: fullAccess,
    clients: fullAccess,
    projects: fullAccess,
    team: fullAccess,
    finance: fullAccess,
    content: fullAccess,
    settings: fullAccess,
    dailyUpdate: fullAccess,
    myAccount: fullAccess,
    helpDesk: fullAccess,
    inquiry: fullAccess,
    tasks: fullAccess,
    reimbursements: fullAccess,
  },

  // CTO - Full access
  cto: {
    dashboard: fullAccess,
    clients: fullAccess,
    projects: fullAccess,
    team: fullAccess,
    finance: fullAccess,
    content: fullAccess,
    settings: fullAccess,
    dailyUpdate: fullAccess,
    myAccount: fullAccess,
    helpDesk: fullAccess,
    inquiry: fullAccess,
    tasks: fullAccess,
    reimbursements: fullAccess,
  },

  // Director - Full access
  director: {
    dashboard: fullAccess,
    clients: fullAccess,
    projects: fullAccess,
    team: fullAccess,
    finance: fullAccess,
    content: fullAccess,
    settings: fullAccess,
    dailyUpdate: fullAccess,
    myAccount: fullAccess,
    helpDesk: fullAccess,
    inquiry: fullAccess,
    tasks: fullAccess,
    reimbursements: fullAccess,
  },

  // Accountant - Finance and admin access
  accountant: {
    dashboard: fullAccess,
    clients: viewOnly,
    projects: viewOnly,
    team: viewOnly,
    finance: fullAccess,
    content: defaultPermission,
    settings: viewOnly,
    dailyUpdate: viewOnly,
    myAccount: fullAccess,
    helpDesk: viewOnly,
    inquiry: defaultPermission,
    tasks: viewOnly,
    reimbursements: fullAccess,
  },

  // HR Manager - Full access (same as admin)
  hr_manager: {
    dashboard: fullAccess,
    clients: fullAccess,
    projects: fullAccess,
    team: fullAccess,
    finance: fullAccess,
    content: fullAccess,
    settings: fullAccess,
    dailyUpdate: fullAccess,
    myAccount: fullAccess,
    helpDesk: fullAccess,
    inquiry: fullAccess,
    tasks: fullAccess,
    reimbursements: fullAccess,
  },

  // CMS Administrator - Full access (same as admin)
  cms_administrator: {
    dashboard: fullAccess,
    clients: fullAccess,
    projects: fullAccess,
    team: fullAccess,
    finance: fullAccess,
    content: fullAccess,
    settings: fullAccess,
    dailyUpdate: fullAccess,
    myAccount: fullAccess,
    helpDesk: fullAccess,
    inquiry: fullAccess,
    tasks: fullAccess,
    reimbursements: fullAccess,
  },

  // Project Manager - Projects and team management
  project_manager: {
    dashboard: fullAccess,
    clients: defaultPermission,
    projects: fullAccess,
    team: defaultPermission,
    finance: defaultPermission,
    content: defaultPermission,
    settings: defaultPermission,
    dailyUpdate: fullAccess,
    myAccount: fullAccess,
    helpDesk: fullAccess,
    inquiry: fullAccess,
    tasks: fullAccess,
    reimbursements: viewEditCreate,
  },

  // Business Development - Inquiry and client access
  business_development: {
    dashboard: viewOnly,
    clients: viewEditCreate,
    projects: viewOnly,
    team: viewOnly,
    finance: viewOnly,
    content: viewOnly,
    settings: viewOnly,
    dailyUpdate: { ...viewEditCreate, canApprove: false },
    myAccount: { ...viewEditCreate, canApprove: false },
    helpDesk: viewEditCreate,
    inquiry: fullAccess,
    tasks: viewOnly,
    reimbursements: viewEditCreate,
  },

  // Management Role
  management: {
    dashboard: fullAccess,
    clients: fullAccess,
    projects: fullAccess,
    team: fullAccess,
    finance: fullAccess,
    content: fullAccess,
    settings: fullAccess,
    dailyUpdate: fullAccess,
    myAccount: fullAccess,
    helpDesk: fullAccess,
    inquiry: fullAccess,
    tasks: fullAccess,
    reimbursements: fullAccess,
  },

  // Developer - Same as existing developer role
  developer: {
    dashboard: viewOnly,
    clients: viewOnly,
    projects: viewOnly,
    team: viewOnly,
    finance: defaultPermission,
    content: defaultPermission,
    settings: defaultPermission,
    dailyUpdate: viewEditCreate,
    myAccount: { ...viewEditCreate, canApprove: false },
    helpDesk: viewEditCreate,
    inquiry: viewOnly,
    tasks: fullAccess,
    reimbursements: viewEditCreate,
  },

  // QA Engineer - Same as developer
  qa_engineer: {
    dashboard: viewOnly,
    clients: viewOnly,
    projects: viewOnly,
    team: viewOnly,
    finance: defaultPermission,
    content: defaultPermission,
    settings: defaultPermission,
    dailyUpdate: viewEditCreate,
    myAccount: { ...viewEditCreate, canApprove: false },
    helpDesk: viewEditCreate,
    inquiry: viewOnly,
    tasks: fullAccess,
    reimbursements: viewEditCreate,
  },

  // DevOps Engineer - Same as developer
  devops_engineer: {
    dashboard: viewOnly,
    clients: viewOnly,
    projects: viewOnly,
    team: viewOnly,
    finance: defaultPermission,
    content: defaultPermission,
    settings: defaultPermission,
    dailyUpdate: viewEditCreate,
    myAccount: { ...viewEditCreate, canApprove: false },
    helpDesk: viewEditCreate,
    inquiry: viewOnly,
    tasks: fullAccess,
    reimbursements: viewEditCreate,
  },

  // UI/UX Designer - Same as developer
  ui_ux_designer: {
    dashboard: viewOnly,
    clients: viewOnly,
    projects: viewOnly,
    team: viewOnly,
    finance: defaultPermission,
    content: defaultPermission,
    settings: defaultPermission,
    dailyUpdate: viewEditCreate,
    myAccount: { ...viewEditCreate, canApprove: false },
    helpDesk: viewEditCreate,
    inquiry: viewOnly,
    tasks: fullAccess,
    reimbursements: viewEditCreate,
  },

  // Frontend Developer
  frontend_developer: {
    dashboard: viewOnly,
    clients: viewOnly,
    projects: viewOnly,
    team: viewOnly,
    finance: defaultPermission,
    content: defaultPermission,
    settings: defaultPermission,
    dailyUpdate: viewEditCreate,
    myAccount: { ...viewEditCreate, canApprove: false },
    helpDesk: viewEditCreate,
    inquiry: viewOnly,
    tasks: fullAccess,
    reimbursements: viewEditCreate,
  },

  // Backend Developer
  backend_developer: {
    dashboard: viewOnly,
    clients: viewOnly,
    projects: viewOnly,
    team: viewOnly,
    finance: defaultPermission,
    content: defaultPermission,
    settings: defaultPermission,
    dailyUpdate: viewEditCreate,
    myAccount: { ...viewEditCreate, canApprove: false },
    helpDesk: viewEditCreate,
    inquiry: viewOnly,
    tasks: fullAccess,
    reimbursements: viewEditCreate,
  },

  // Fullstack Developer
  fullstack_developer: {
    dashboard: viewOnly,
    clients: viewOnly,
    projects: viewOnly,
    team: viewOnly,
    finance: defaultPermission,
    content: defaultPermission,
    settings: defaultPermission,
    dailyUpdate: viewEditCreate,
    myAccount: { ...viewEditCreate, canApprove: false },
    helpDesk: viewEditCreate,
    inquiry: viewOnly,
    tasks: fullAccess,
    reimbursements: viewEditCreate,
  },

  // Mobile Developer
  mobile_developer: {
    dashboard: viewOnly,
    clients: viewOnly,
    projects: viewOnly,
    team: viewOnly,
    finance: defaultPermission,
    content: defaultPermission,
    settings: defaultPermission,
    dailyUpdate: viewEditCreate,
    myAccount: { ...viewEditCreate, canApprove: false },
    helpDesk: viewEditCreate,
    inquiry: viewOnly,
    tasks: fullAccess,
    reimbursements: viewEditCreate,
  },

  // Digital Marketing - Content and marketing access
  digital_marketing: {
    dashboard: viewOnly,
    clients: viewOnly,
    projects: viewOnly,
    team: viewOnly,
    finance: viewOnly,
    content: fullAccess,
    settings: viewOnly,
    dailyUpdate: viewEditCreate,
    myAccount: { ...viewEditCreate, canApprove: false },
    helpDesk: viewEditCreate,
    inquiry: viewOnly,
    tasks: viewEditCreate,
    reimbursements: viewEditCreate,
  },

  // Business Analyst - Analysis and reporting access
  business_analyst: {
    dashboard: viewOnly,
    clients: viewOnly,
    projects: viewOnly,
    team: viewOnly,
    finance: viewOnly,
    content: viewOnly,
    settings: viewOnly,
    dailyUpdate: viewEditCreate,
    myAccount: { ...viewEditCreate, canApprove: false },
    helpDesk: viewEditCreate,
    inquiry: viewOnly,
    tasks: viewEditCreate,
    reimbursements: viewEditCreate,
  },

  // Intern Role
  intern: {
    dashboard: viewOnly,
    clients: viewOnly,
    projects: viewOnly,
    team: viewOnly,
    finance: defaultPermission,
    content: defaultPermission,
    settings: defaultPermission,
    dailyUpdate: viewAndCreate,
    myAccount: { ...viewAndCreate, canApprove: false },
    helpDesk: viewAndCreate,
    inquiry: viewOnly,
    tasks: viewAndCreate,
    reimbursements: viewEditCreate,
  },

  // Architect Role
  architect: {
    dashboard: viewOnly,
    clients: viewOnly,
    projects: fullAccess,
    team: viewOnly,
    finance: defaultPermission,
    content: defaultPermission,
    settings: defaultPermission,
    dailyUpdate: viewEditCreate,
    myAccount: { ...viewEditCreate, canApprove: false },
    helpDesk: viewEditCreate,
    inquiry: viewOnly,
    tasks: fullAccess,
    reimbursements: viewEditCreate,
  },

  // HR Executive - View/edit team, leaves, and daily updates
  hr_executive: {
    dashboard: viewEditCreate,
    clients: viewOnly,
    projects: viewOnly,
    team: viewEditCreate,
    finance: viewOnly,
    content: viewOnly,
    settings: viewOnly,
    dailyUpdate: viewEditCreate,
    myAccount: fullAccess,
    helpDesk: viewEditCreate,
    inquiry: viewOnly,
    tasks: viewEditCreate,
    reimbursements: viewEditCreate,
  },

  // Finance - Full finance & reimbursements access, view-only team & projects
  finance: {
    dashboard: fullAccess,
    clients: viewOnly,
    projects: viewOnly,
    team: viewOnly,
    finance: fullAccess,
    content: defaultPermission,
    settings: viewOnly,
    dailyUpdate: viewOnly,
    myAccount: fullAccess,
    helpDesk: viewOnly,
    inquiry: defaultPermission,
    tasks: viewOnly,
    reimbursements: fullAccess,
  },

  // Manager - Projects, team, tasks, and reimbursement approvals
  manager: {
    dashboard: fullAccess,
    clients: viewOnly,
    projects: fullAccess,
    team: viewEditCreate,
    finance: defaultPermission,
    content: defaultPermission,
    settings: defaultPermission,
    dailyUpdate: fullAccess,
    myAccount: fullAccess,
    helpDesk: fullAccess,
    inquiry: viewOnly,
    tasks: fullAccess,
    reimbursements: fullAccess,
  },

  // Employee - Standard employee/developer-like access
  employee: {
    dashboard: viewOnly,
    clients: viewOnly,
    projects: viewOnly,
    team: viewOnly,
    finance: defaultPermission,
    content: defaultPermission,
    settings: defaultPermission,
    dailyUpdate: viewEditCreate,
    myAccount: { ...viewEditCreate, canApprove: false },
    helpDesk: viewEditCreate,
    inquiry: viewOnly,
    tasks: fullAccess,
    reimbursements: viewEditCreate,
  },

  // Freelancer - View only, edit tasks
  freelancer: {
    dashboard: viewOnly,
    clients: defaultPermission,
    projects: viewOnly,
    team: defaultPermission,
    finance: defaultPermission,
    content: defaultPermission,
    settings: defaultPermission,
    dailyUpdate: viewEditCreate,
    myAccount: { ...viewEditCreate, canApprove: false },
    helpDesk: viewEditCreate,
    inquiry: defaultPermission,
    tasks: viewEditCreate,
    reimbursements: defaultPermission,
  },

  // Contractor - View only, edit tasks
  contractor: {
    dashboard: viewOnly,
    clients: defaultPermission,
    projects: viewOnly,
    team: defaultPermission,
    finance: defaultPermission,
    content: defaultPermission,
    settings: defaultPermission,
    dailyUpdate: viewEditCreate,
    myAccount: { ...viewEditCreate, canApprove: false },
    helpDesk: viewEditCreate,
    inquiry: defaultPermission,
    tasks: viewEditCreate,
    reimbursements: defaultPermission,
  },

  // Auditor - View-only access
  auditor: {
    dashboard: viewOnly,
    clients: viewOnly,
    projects: viewOnly,
    team: viewOnly,
    finance: viewOnly,
    content: defaultPermission,
    settings: viewOnly,
    dailyUpdate: viewOnly,
    myAccount: viewOnly,
    helpDesk: viewOnly,
    inquiry: viewOnly,
    tasks: viewOnly,
    reimbursements: viewOnly,
  },

  // Client - Limited access
  client: {
    dashboard: viewOnly,
    clients: defaultPermission,
    projects: viewOnly,
    team: defaultPermission,
    finance: viewOnly,
    content: defaultPermission,
    settings: defaultPermission,
    dailyUpdate: defaultPermission,
    myAccount: defaultPermission,
    helpDesk: viewEditCreate,
    inquiry: defaultPermission,
    tasks: viewOnly,
    reimbursements: defaultPermission,
  },
};

/**
 * Check if a role has permission for a specific module and action
 */
export function hasPermission(
  role: UserRole,
  module: keyof RolePermissions,
  action: keyof Permission
): boolean {
  let permissions = rolePermissions[role];

  // Case-insensitive fallback for safety
  if (!permissions) {
    const normalizedRole = role.toLowerCase() as UserRole;
    permissions = rolePermissions[normalizedRole];
  }

  if (!permissions) return false;

  const modulePermission = permissions[module];
  if (!modulePermission) return false;

  return modulePermission[action] === true;
}

/**
 * Get all permissions for a role
 */
export function getRolePermissions(role: UserRole): RolePermissions | null {
  return rolePermissions[role] || null;
}

/**
 * Check if user has full access (admin-like roles)
 */
export function hasFullAccess(role: UserRole): boolean {
  const raw = String(role).toLowerCase().replace(/[\s-]+/g, '_');
  return [
    'super_admin',
    'superadmin',
    'admin',
    'owner',
    'business_owner',
    'tenant_owner',
    'ceo',
    'cto',
    'director',
    'hr_manager',
    'accountant',
    'cms_administrator',
    'management'
  ].includes(raw);
}

/**
 * Identify which dashboard layout to display
 */
export function getDashboardType(role: UserRole): 'admin' | 'employee' {
  const raw = String(role).toLowerCase().replace(/[\s-]+/g, '_');
  if (hasFullAccess(role)) return 'admin';
  
  const adminLayoutRoles = [
    'hr_executive',
    'finance',
    'project_manager',
    'manager',
    'devops_engineer',
    'business_analyst'
  ];
  if (adminLayoutRoles.includes(raw)) return 'admin';
  
  return 'employee';
}

/**
 * Get authorized dashboard views for a role
 */
export function getRoleDashboardViews(role: UserRole): ('ceo' | 'hr' | 'finance' | 'operations' | 'manager')[] {
  const raw = String(role).toLowerCase().replace(/[\s-]+/g, '_');
  
  // Super admin / Executive C-level can see all sections
  if (hasFullAccess(role) && ![
    'hr_manager',
    'accountant'
  ].includes(raw)) {
    return ['ceo', 'hr', 'finance', 'operations', 'manager'];
  }
  
  // Specific role mappings
  if (raw === 'hr_manager' || raw === 'hr_executive') {
    return ['hr'];
  }
  if (raw === 'accountant' || raw === 'finance') {
    return ['finance'];
  }
  if (raw === 'project_manager' || raw === 'manager') {
    return ['manager'];
  }
  if (raw === 'devops_engineer' || raw === 'business_analyst') {
    return ['operations'];
  }
  
  return [];
}

/**
 * Check if user is an employee-level role for analytics scoping
 */
export function isEmployeeRole(role: UserRole): boolean {
  return getDashboardType(role) === 'employee';
}



/**
 * Get user-friendly role name
 */
export function getRoleName(role: UserRole): string {
  const roleNames: Record<UserRole, string> = {
    super_admin: 'Super Administrator',
    admin: 'Administrator',
    owner: 'Business Owner',
    ceo: 'CEO',
    cto: 'CTO',
    director: 'Director',
    hr_manager: 'HR Manager',
    hr_executive: 'HR Executive',
    finance: 'Finance Specialist',
    accountant: 'Accountant',
    cms_administrator: 'CMS Administrator',
    manager: 'Manager',
    project_manager: 'Project Manager',
    business_development: 'Business Development',
    developer: 'Developer',
    employee: 'Employee',
    freelancer: 'Freelancer',
    contractor: 'Contractor',
    auditor: 'Compliance Auditor',
    frontend_developer: 'Frontend Developer',
    backend_developer: 'Backend Developer',
    fullstack_developer: 'Fullstack Developer',
    mobile_developer: 'Mobile Developer',
    qa_engineer: 'QA Engineer',
    devops_engineer: 'DevOps Engineer',
    ui_ux_designer: 'UI/UX Designer',
    digital_marketing: 'Digital Marketing',
    business_analyst: 'Business Analyst',
    management: 'Management',
    intern: 'Intern',
    architect: 'Architect',
    client: 'Client',
  };

  return roleNames[role] || role;
}
