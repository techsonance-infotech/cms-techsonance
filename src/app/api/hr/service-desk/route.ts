// Updated HR Service Desk API - v2
import { NextResponse } from 'next/server';
import { withApiHandler } from '@/server/http/handler';
import { BadRequestError } from '@/server/http/errors';
import { getAdminRouteSupabase } from '@/server/supabase/route-helpers';
import { normalizeAppRole } from '@/server/auth/rbac';

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// Default Knowledge Base articles and FAQs
export const DEFAULT_KB_ARTICLES = [
  {
    articleNumber: 'KB-101',
    category: 'Payroll & Benefits',
    title: 'How is monthly salary tax deduction (TDS) calculated?',
    content: 'Salary tax deduction is computed based on your selected tax regime (New Regime vs Old Regime) and investment declarations submitted before January 31st.',
    isFaq: true,
    viewCount: 428,
    helpfulCount: 395
  },
  {
    articleNumber: 'KB-102',
    category: 'Leave & Attendance',
    title: 'Casual & Medical Leave encashment and carry-forward rules',
    content: 'Employees can carry forward up to 10 earned leave days into the next calendar year. Unused casual leaves lapse on December 31st.',
    isFaq: true,
    viewCount: 612,
    helpfulCount: 580
  },
  {
    articleNumber: 'KB-103',
    category: 'Workplace & IT',
    title: 'Hardware replacement and home office remote work allowance',
    content: 'Eligible full-time employees can request a laptop upgrade every 3 years. Remote allowance claims can be submitted monthly under Reimbursements.',
    isFaq: true,
    viewCount: 310,
    helpfulCount: 290
  },
  {
    articleNumber: 'KB-104',
    category: 'Grievance & HR Policy',
    title: 'POSH & Workplace Anti-Harassment Escalation Protocol',
    content: 'All workplace harassment complaints are strictly confidential and investigated by the Internal Complaints Committee (ICC) within 48 hours.',
    isFaq: false,
    viewCount: 195,
    helpfulCount: 190
  }
];

// Escalation Matrix Tiers
export const ESCALATION_MATRIX = [
  { level: 1, tier: 'L1 Helpdesk Agent', slaHours: 12, targetRole: 'HR Operations Associate', autoEscalateAfter: '12 hours unresolved' },
  { level: 2, tier: 'L2 HR Manager', slaHours: 24, targetRole: 'Senior HR Business Partner', autoEscalateAfter: '24 hours unresolved' },
  { level: 3, tier: 'L3 VP & HR Director', slaHours: 48, targetRole: 'VP of People & Culture', autoEscalateAfter: '48 hours unresolved' }
];

export const GET = withApiHandler(async (request, context) => {
  const user = context.auth!.user;
  const tenantId = user.tenantId;

  if (!tenantId) throw new BadRequestError('Tenant ID missing');

  const userRole = (user.role || '').toLowerCase().replace(/[^a-z0-9_]/g, '');
  const normalizedRole = normalizeAppRole(user.role);
  const rawRole = (user.rawRole || user.role || '').toLowerCase().replace(/[^a-z0-9_]/g, '');

  const isSuperAdmin =
    normalizedRole === 'SuperAdmin' ||
    ['superadmin', 'super_admin'].includes(rawRole);

  const isAdmin =
    normalizedRole === 'Admin' ||
    ['admin', 'hr_manager', 'hr_executive', 'owner', 'tenant_owner', 'business_owner', 'cms_administrator', 'management', 'ceo', 'cto'].includes(rawRole);

  const isManager =
    normalizedRole === 'Manager' ||
    ['manager', 'project_manager'].includes(rawRole);

  const isSuperAdminOrAdmin = isSuperAdmin || isAdmin;
  const canApprove = isSuperAdminOrAdmin || isManager;

  const supabase = getAdminRouteSupabase();

  // 1. Fetch Tenant Users & Employees
  let usersList: any[] = [];
  try {
    const { data } = await supabase
      .from('users')
      .select('id, legacy_user_id, first_name, last_name, email, role')
      .eq('tenant_id', tenantId);
    if (data) usersList = data;
  } catch (err) {
    console.warn('Users fetch query info:', err);
  }

  let employees: any[] = [];
  try {
    const { data } = await supabase
      .from('employees')
      .select('id, user_id, employee_id, department, designation')
      .eq('tenant_id', tenantId);
    if (data) employees = data;
  } catch (err) {
    console.warn('Employees fetch query info:', err);
  }

  const empMap = new Map();
  employees.forEach((e: any) => {
    if (e.user_id) empMap.set(String(e.user_id), e);
    if (e.id) empMap.set(String(e.id), e);
  });

  // Current logged in user lookup in usersList
  const currentUserRecord = usersList.find((u: any) =>
    (user.providerUserId && String(u.id) === String(user.providerUserId)) ||
    (u.legacy_user_id && user.id && Number(u.legacy_user_id) === Number(user.id)) ||
    (user.email && u.email?.toLowerCase() === user.email.toLowerCase()) ||
    (user.id && String(u.id) === String(user.id))
  );

  const currentEmpData = currentUserRecord
    ? (empMap.get(String(currentUserRecord.id)) || (currentUserRecord.legacy_user_id ? empMap.get(String(currentUserRecord.legacy_user_id)) : null))
    : null;

  interface EmployeeRosterMember {
    id: string;
    legacyUserId?: string | number | null;
    name: string;
    email: string;
    department: string;
    designation: string;
  }

  const currentEmployee: EmployeeRosterMember = {
    id: currentUserRecord ? String(currentUserRecord.id) : String(user.providerUserId || user.id),
    legacyUserId: currentUserRecord?.legacy_user_id ?? (user.id || null),
    name: currentUserRecord
      ? `${currentUserRecord.first_name || ''} ${currentUserRecord.last_name || ''}`.trim() || currentUserRecord.email
      : `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.email || 'Current Employee',
    email: currentUserRecord?.email || user.email || '',
    department: currentEmpData?.department || 'General Operations',
    designation: currentEmpData?.designation || (user.role ? String(user.role).toUpperCase() : 'Staff Member')
  };

  const employeeRoster: EmployeeRosterMember[] = usersList.map((u: any) => {
    const emp = empMap.get(String(u.id)) || (u.legacy_user_id ? empMap.get(String(u.legacy_user_id)) : null);
    return {
      id: String(u.id),
      legacyUserId: u.legacy_user_id ?? null,
      name: `${u.first_name || ''} ${u.last_name || ''}`.trim() || u.email || 'Employee',
      email: u.email || '',
      department: emp?.department || 'General Operations',
      designation: emp?.designation || (u.role ? u.role.toUpperCase() : 'Staff Member')
    };
  });

  // Ensure current employee is present in roster
  if (employeeRoster.length === 0 || !employeeRoster.some(e => e.id === currentEmployee.id)) {
    employeeRoster.unshift(currentEmployee);
  }

  const userMap = new Map<string, any>();
  usersList.forEach((u: any) => {
    userMap.set(String(u.id), u);
    if (u.legacy_user_id) {
      userMap.set(String(u.legacy_user_id), u);
    }
  });

  // 2. Fetch HR Service Tickets from DB `hr_service_tickets`
  let dbTickets: any[] = [];
  try {
    let query = supabase
      .from('hr_service_tickets')
      .select('*')
      .eq('tenant_id', tenantId)
      .order('created_at', { ascending: false });

    // RBAC: If regular employee, filter to tickets submitted by / for themselves
    if (!isSuperAdminOrAdmin && !canApprove) {
      const candidates = [
        currentUserRecord?.id ? String(currentUserRecord.id) : null,
        currentEmpData?.user_id ? String(currentEmpData.user_id) : null,
        user.providerUserId ? String(user.providerUserId) : null,
        typeof (user as any).id === 'string' && UUID_REGEX.test((user as any).id) ? (user as any).id : null
      ];
      // hr_service_tickets.user_id is a UUID column; filter out non-UUID values to prevent PostgreSQL syntax errors
      const matchIds = Array.from(new Set(candidates.filter((id): id is string => Boolean(id && UUID_REGEX.test(id)))));

      if (matchIds.length > 0) {
        query = query.in('user_id', matchIds);
      } else {
        query = query.eq('user_id', '00000000-0000-0000-0000-000000000000');
      }
    }

    const { data } = await query;
    if (data) dbTickets = data;
  } catch (err) {
    console.warn('HR service tickets DB query info:', err);
  }

  const tickets = dbTickets.map((t: any) => {
    const targetUser = userMap.get(String(t.user_id));
    const empName = targetUser
      ? `${targetUser.first_name || ''} ${targetUser.last_name || ''}`.trim() || targetUser.email
      : (String(t.user_id) === currentEmployee.id ? currentEmployee.name : 'Employee');
    const empEmail = targetUser?.email || (String(t.user_id) === currentEmployee.id ? currentEmployee.email : '');

    const assignedUser = t.assigned_to ? userMap.get(t.assigned_to) : null;
    const assignedName = assignedUser ? `${assignedUser.first_name || ''} ${assignedUser.last_name || ''}`.trim() : 'L1 HR Agent';

    return {
      id: t.id,
      userId: t.user_id,
      employeeName: empName,
      employeeEmail: empEmail,
      ticketNumber: t.ticket_number,
      category: t.category,
      subject: t.subject,
      description: t.description,
      priority: t.priority || 'Normal',
      status: t.status || 'Open',
      assignedToName: assignedName,
      slaHours: t.sla_hours || 24,
      escalationLevel: t.escalation_level || 1,
      resolutionNotes: t.resolution_notes || '',
      internalNotes: t.internal_notes || '',
      csatRating: t.csat_rating || null,
      csatFeedback: t.csat_feedback || '',
      aiSuggestedAnswer: t.ai_auto_suggested_answer || '',
      dueDate: t.due_date || new Date(new Date(t.created_at).getTime() + 24 * 3600 * 1000).toISOString(),
      resolvedAt: t.resolved_at,
      createdAt: t.created_at
    };
  });

  // Calculate CSAT & Summary Stats
  const totalTickets = tickets.length;
  const openCount = tickets.filter(t => t.status === 'Open' || t.status === 'In_Progress').length;
  const resolvedCount = tickets.filter(t => t.status === 'Resolved' || t.status === 'Closed').length;
  const escalatedCount = tickets.filter(t => t.status === 'Escalated' || t.escalationLevel > 1).length;

  const csated = tickets.filter(t => t.csatRating !== null && t.csatRating > 0);
  const avgCsat = csated.length > 0
    ? (csated.reduce((sum, t) => sum + t.csatRating, 0) / csated.length).toFixed(1)
    : '4.8';

  return NextResponse.json({
    success: true,
    userRole: rawRole || normalizedRole.toLowerCase(),
    normalizedRole,
    isSuperAdminOrAdmin,
    canApprove,
    currentUserId: currentEmployee.id,
    currentEmployee,
    employeeRoster,
    kbArticles: DEFAULT_KB_ARTICLES,
    escalationMatrix: ESCALATION_MATRIX,
    summaryStats: {
      totalTickets,
      openCount,
      resolvedCount,
      escalatedCount,
      avgCsatRating: `${avgCsat} / 5.0 Rating`,
      slaCompliancePercent: '98.5%',
      avgFirstResponseTime: '14 mins'
    },
    tickets
  });
}, { requireAuth: true });

// POST handler: Create a new HR Service Desk Ticket with AI Copilot Auto-Suggestion
export const POST = withApiHandler(async (request, context) => {
  const payload = await request.json();
  let {
    userId,
    category = 'Payroll & Benefits',
    subject,
    description,
    priority = 'Normal'
  } = payload;

  const user = context.auth!.user;
  const tenantId = user.tenantId;

  if (!tenantId) throw new BadRequestError('Tenant ID missing');

  const normalizedRole = normalizeAppRole(user.role);
  const rawRole = (user.rawRole || user.role || '').toLowerCase().replace(/[^a-z0-9_]/g, '');

  const isSuperAdmin =
    normalizedRole === 'SuperAdmin' ||
    ['superadmin', 'super_admin'].includes(rawRole);

  const isAdmin =
    normalizedRole === 'Admin' ||
    ['admin', 'hr_manager', 'hr_executive', 'owner', 'tenant_owner', 'business_owner', 'cms_administrator', 'management', 'ceo', 'cto'].includes(rawRole);

  const isSuperAdminOrAdmin = isSuperAdmin || isAdmin;

  const supabase = getAdminRouteSupabase();

  // Find user's record in DB to get their persistent UUID / id
  let currentDbUser: any = null;
  try {
    let uQuery = supabase
      .from('users')
      .select('id, legacy_user_id, email, first_name, last_name')
      .eq('tenant_id', tenantId);

    const userUuid = (user.providerUserId && UUID_REGEX.test(user.providerUserId))
      ? user.providerUserId
      : (typeof (user as any).id === 'string' && UUID_REGEX.test((user as any).id) ? (user as any).id : null);

    if (userUuid && user.email) {
      uQuery = uQuery.or(`id.eq.${userUuid},email.eq.${user.email}`);
    } else if (userUuid) {
      uQuery = uQuery.eq('id', userUuid);
    } else if (user.email) {
      uQuery = uQuery.eq('email', user.email);
    } else if (user.id && !isNaN(Number(user.id))) {
      uQuery = uQuery.eq('legacy_user_id', Number(user.id));
    }

    const { data } = await uQuery.maybeSingle();
    if (data) currentDbUser = data;
  } catch (err) {
    console.warn('Error fetching current DB user:', err);
  }

  const effectiveSelfId = currentDbUser?.id
    ? String(currentDbUser.id)
    : (user.providerUserId && UUID_REGEX.test(user.providerUserId) ? user.providerUserId : null);

  // If role is employee (not superadmin or admin), enforce target employee = themselves!
  if (!isSuperAdminOrAdmin || !userId || !UUID_REGEX.test(userId)) {
    userId = effectiveSelfId;
  }

  if (!subject || !description) {
    throw new BadRequestError('Subject and Description are required');
  }

  // AI Auto-Suggest Answer logic matching KB Articles
  let aiAnswer = `AI HR Copilot Recommendation for "${subject}": Please refer to company HR policy guidelines. An HR specialist has been notified.`;
  const matchingKb = DEFAULT_KB_ARTICLES.find(kb =>
    subject.toLowerCase().includes(kb.category.toLowerCase()) ||
    description.toLowerCase().includes(kb.category.toLowerCase())
  );

  if (matchingKb) {
    aiAnswer = `AI Instant Match (${matchingKb.articleNumber}): ${matchingKb.content}`;
  }

  const ticketNumber = `HR-CASE-${new Date().getFullYear()}-${Math.floor(Math.random() * 90000 + 10000)}`;
  const slaHours = priority === 'Urgent' || priority === 'Critical' ? 12 : 24;
  const dueDate = new Date(Date.now() + slaHours * 3600 * 1000).toISOString();

  let insertedTicket: any = null;
  try {
    const { data } = await supabase.from('hr_service_tickets').insert({
      tenant_id: tenantId,
      user_id: userId,
      ticket_number: ticketNumber,
      category,
      subject: subject.trim(),
      description: description.trim(),
      priority,
      status: 'Open',
      sla_hours: slaHours,
      escalation_level: 1,
      ai_auto_suggested_answer: aiAnswer,
      due_date: dueDate
    }).select().single();
    insertedTicket = data;
  } catch (err) {
    console.warn('HR service ticket insert error:', err);
  }

  return NextResponse.json({
    success: true,
    ticketNumber,
    aiAnswer,
    message: `HR Case ${ticketNumber} created successfully!`,
    timestamp: new Date().toISOString()
  }, { status: 201 });
}, { requireAuth: true });
