import { NextResponse } from 'next/server';
import { withApiHandler } from '@/server/http/handler';
import { BadRequestError, ForbiddenError } from '@/server/http/errors';
import { getAdminRouteSupabase } from '@/server/supabase/route-helpers';
import { COMPLIANCE_DOMAINS } from '@/server/compliance/constants';

export const GET = withApiHandler(async (request, context) => {
  const user = context.auth!.user;
  const tenantId = user.tenantId;

  if (!tenantId) throw new BadRequestError('Tenant ID missing');

  const userRole = (user.role || '').toLowerCase().replace(/[^a-z0-9_]/g, '');
  const canApprove = ['admin', 'hr_manager', 'project_manager'].includes(userRole);

  const supabase = getAdminRouteSupabase();

  // 1. Fetch Users & Employees
  let usersList: any[] = [];
  try {
    const { data } = await supabase
      .from('users')
      .select('id, first_name, last_name, email, role')
      .eq('tenant_id', tenantId);
    if (data) usersList = data;
  } catch (err) {
    console.warn('Users fetch query info:', err);
  }

  let employees: any[] = [];
  try {
    const { data } = await supabase
      .from('employees')
      .select('id, user_id, department, designation')
      .eq('tenant_id', tenantId);
    if (data) employees = data;
  } catch (err) {
    console.warn('Employees fetch query info:', err);
  }

  const empMap = new Map(employees.map((e: any) => [e.user_id, e]));

  const employeeRoster = usersList.map((u: any) => {
    const emp = empMap.get(u.id);
    return {
      id: u.id,
      name: `${u.first_name || ''} ${u.last_name || ''}`.trim() || u.email || 'Employee',
      email: u.email || '',
      department: emp?.department || 'General Operations',
      designation: emp?.designation || (u.role ? u.role.toUpperCase() : 'Staff Member')
    };
  });

  const userMap = new Map(usersList.map((u: any) => [u.id, u]));

  // 2. Fetch ALL Compliance Items from DB `compliance_items`
  let dbItems: any[] = [];
  try {
    let query = supabase
      .from('compliance_items')
      .select('*')
      .eq('tenant_id', tenantId)
      .order('created_at', { ascending: false });

    // RBAC: If regular employee, filter to items for themselves
    if (!canApprove) {
      query = query.eq('user_id', user.id);
    }

    const { data } = await query;
    if (data) dbItems = data;
  } catch (err) {
    console.warn('Compliance items DB query info:', err);
  }

  const items = dbItems.map((c: any) => {
    const targetUser = userMap.get(c.user_id);
    const empName = targetUser ? `${targetUser.first_name || ''} ${targetUser.last_name || ''}`.trim() : 'Employee';

    return {
      id: c.id,
      userId: c.user_id,
      employeeName: empName,
      category: c.category,
      itemName: c.item_name,
      complianceStatus: c.compliance_status || 'Compliant',
      dueDate: c.due_date || new Date(Date.now() + 86400000 * 14).toISOString(),
      completedAt: c.completed_at,
      verificationNotes: c.verification_notes || '',
      createdAt: c.created_at
    };
  });

  // 3. Fetch Audit Findings from DB `compliance_audit_findings`
  let dbFindings: any[] = [];
  try {
    const { data } = await supabase
      .from('compliance_audit_findings')
      .select('*')
      .eq('tenant_id', tenantId)
      .order('created_at', { ascending: false });
    if (data) dbFindings = data;
  } catch (err) {
    console.warn('Audit findings DB query info:', err);
  }

  const auditFindings = dbFindings.map((f: any) => ({
    id: f.id || f.findingCode,
    findingCode: f.finding_code || f.findingCode || `AUDIT-${f.id?.slice(0, 8) || '0000'}`,
    category: f.category,
    severity: f.severity || 'Medium',
    description: f.description,
    status: f.status || 'Open',
    capaPlan: f.corrective_action_plan || f.capaPlan || '',
    dueDate: f.due_date || f.dueDate
  }));

  // 4. Compute Per-Domain Live Statistics from actual compliance items
  const domainCategorySet = new Set(COMPLIANCE_DOMAINS.map(d => d.id));
  const domainStatsMap = new Map<string, {
    totalChecks: number;
    compliantCount: number;
    pendingCount: number;
    nonCompliantCount: number;
    latestDueDate: string | null;
    lastVerifiedAt: string | null;
  }>();

  // Initialize all domains with zero counts
  for (const d of COMPLIANCE_DOMAINS) {
    domainStatsMap.set(d.id, {
      totalChecks: 0,
      compliantCount: 0,
      pendingCount: 0,
      nonCompliantCount: 0,
      latestDueDate: null,
      lastVerifiedAt: null
    });
  }

  // Aggregate items into domain stats
  for (const item of items) {
    const stats = domainStatsMap.get(item.category);
    if (!stats) continue;

    stats.totalChecks++;

    if (item.complianceStatus === 'Compliant') {
      stats.compliantCount++;
    } else if (item.complianceStatus === 'Non_Compliant') {
      stats.nonCompliantCount++;
    } else {
      // Pending, Expiring_Soon, etc.
      stats.pendingCount++;
    }

    // Track nearest due date
    if (item.dueDate) {
      if (!stats.latestDueDate || item.dueDate < stats.latestDueDate) {
        stats.latestDueDate = item.dueDate;
      }
    }

    // Track most recent completion
    if (item.completedAt) {
      if (!stats.lastVerifiedAt || item.completedAt > stats.lastVerifiedAt) {
        stats.lastVerifiedAt = item.completedAt;
      }
    }
  }

  // Build domain response with live stats
  const domainsWithStats = COMPLIANCE_DOMAINS.map(d => {
    const stats = domainStatsMap.get(d.id)!;
    const compliancePercent = stats.totalChecks > 0
      ? Math.round((stats.compliantCount / stats.totalChecks) * 100)
      : null; // null = no data yet

    return {
      ...d,
      totalChecks: stats.totalChecks,
      compliantCount: stats.compliantCount,
      pendingCount: stats.pendingCount,
      nonCompliantCount: stats.nonCompliantCount,
      compliancePercent,
      latestDueDate: stats.latestDueDate,
      lastVerifiedAt: stats.lastVerifiedAt
    };
  });

  // 5. Global Summary Metrics (fully dynamic)
  const totalChecks = items.length;
  const compliantCount = items.filter(i => i.complianceStatus === 'Compliant').length;
  const pendingCount = items.filter(i => i.complianceStatus === 'Pending' || i.complianceStatus === 'Expiring_Soon').length;
  const nonCompliantCount = items.filter(i => i.complianceStatus === 'Non_Compliant').length;

  const complianceRatePercent = totalChecks > 0
    ? `${Math.round((compliantCount / totalChecks) * 100)}%`
    : '0%';

  const openFindingsCount = auditFindings.filter((f: any) => f.status !== 'Closed').length;

  // Compute audit readiness from compliance rate + open findings penalty
  const rawReadiness = totalChecks > 0
    ? Math.round((compliantCount / totalChecks) * 100)
    : 0;
  const findingsPenalty = Math.min(openFindingsCount * 2, 20); // Each open finding reduces readiness by 2%, max 20%
  const auditReadinessValue = Math.max(0, rawReadiness - findingsPenalty);
  const auditReadinessScore = totalChecks > 0
    ? `${auditReadinessValue}% Audit Ready`
    : 'No Data';

  // Domains with data
  const domainsWithData = domainsWithStats.filter(d => d.totalChecks > 0).length;

  // Run compliance engine scan to fetch auto-violations, scores, and forecast
  let engineResult;
  try {
    const { runComplianceEngineScan } = await import('@/server/compliance/compliance-engine');
    engineResult = await runComplianceEngineScan(tenantId);
  } catch (err) {
    console.error('Core GET handler compliance scan run failed:', err);
  }

  return NextResponse.json({
    success: true,
    userRole,
    currentUserId: user.id,
    canApprove,
    employeeRoster,
    domains: domainsWithStats,
    summaryStats: {
      totalChecks,
      compliantCount,
      pendingCount,
      nonCompliantCount,
      complianceRatePercent: engineResult ? `${engineResult.globalScore}%` : complianceRatePercent,
      openFindingsCount,
      regulatoryPenaltiesAvoided: nonCompliantCount === 0
        ? '0 Penalties (100% Statutory Compliant)'
        : `${nonCompliantCount} Non-Compliant Items Flagged`,
      auditReadinessScore,
      domainsMonitored: domainsWithData
    },
    items,
    auditFindings,
    violations: engineResult ? engineResult.violations : [],
    employeeScores: engineResult ? engineResult.employeeScores : [],
    departmentScores: engineResult ? engineResult.departmentScores : [],
    upcomingDeadlines: engineResult ? engineResult.upcomingDeadlines : [],
    globalComplianceScore: engineResult ? engineResult.globalScore : 100
  });
}, { requireAuth: true });

// POST handler: Create a new Compliance Check Item
export const POST = withApiHandler(async (request, context) => {
  const payload = await request.json();
  let {
    userId,
    category = 'Policy Acceptance',
    itemName,
    complianceStatus = 'Compliant',
    dueDate,
    verificationNotes = ''
  } = payload;

  const user = context.auth!.user;
  const tenantId = user.tenantId;

  if (!tenantId) throw new BadRequestError('Tenant ID missing');

  const userRole = (user.role || '').toLowerCase().replace(/[^a-z0-9_]/g, '');
  const canApprove = ['admin', 'hr_manager', 'project_manager'].includes(userRole);

  if (!canApprove || !userId) {
    userId = user.id;
  }

  if (!itemName) {
    throw new BadRequestError('Compliance Item Name is required');
  }

  // Validate category exists in domain catalog
  const validCategories = COMPLIANCE_DOMAINS.map(d => d.id);
  if (!validCategories.includes(category)) {
    throw new BadRequestError(`Invalid compliance domain: ${category}`);
  }

  // Validate compliance status
  const validStatuses = ['Compliant', 'Pending', 'Non_Compliant', 'Expiring_Soon'];
  if (!validStatuses.includes(complianceStatus)) {
    complianceStatus = 'Compliant';
  }

  const supabase = getAdminRouteSupabase();

  try {
    await supabase.from('compliance_items').insert({
      tenant_id: tenantId,
      user_id: userId,
      category,
      item_name: itemName.trim(),
      compliance_status: complianceStatus,
      due_date: dueDate || new Date(Date.now() + 86400000 * 30).toISOString(),
      completed_at: complianceStatus === 'Compliant' ? new Date().toISOString() : null,
      verification_notes: verificationNotes.trim()
    }).select().single();
  } catch (err) {
    console.warn('Compliance item insert error:', err);
  }

  return NextResponse.json({
    success: true,
    message: `Compliance record (${category}) logged successfully!`,
    timestamp: new Date().toISOString()
  }, { status: 201 });
}, { requireAuth: true });

// PATCH handler: Update compliance item status
export const PATCH = withApiHandler(async (request, context) => {
  const payload = await request.json();
  const { itemId, complianceStatus, verificationNotes } = payload;

  const user = context.auth!.user;
  const tenantId = user.tenantId;

  if (!tenantId) throw new BadRequestError('Tenant ID missing');
  if (!itemId) throw new BadRequestError('Compliance Item ID is required');

  const userRole = (user.role || '').toLowerCase().replace(/[^a-z0-9_]/g, '');
  const canApprove = ['admin', 'hr_manager', 'project_manager'].includes(userRole);

  if (!canApprove) {
    throw new ForbiddenError('Insufficient permissions. Status updates require Manager access.');
  }

  // Validate compliance status
  const validStatuses = ['Compliant', 'Pending', 'Non_Compliant', 'Expiring_Soon'];
  if (complianceStatus && !validStatuses.includes(complianceStatus)) {
    throw new BadRequestError(`Invalid compliance status. Must be one of: ${validStatuses.join(', ')}`);
  }

  const supabase = getAdminRouteSupabase();

  const updatePayload: Record<string, any> = {
    updated_at: new Date().toISOString()
  };

  if (complianceStatus) {
    updatePayload.compliance_status = complianceStatus;
    if (complianceStatus === 'Compliant') {
      updatePayload.completed_at = new Date().toISOString();
    }
  }

  if (verificationNotes !== undefined) {
    updatePayload.verification_notes = verificationNotes.trim();
  }

  try {
    const { error } = await supabase
      .from('compliance_items')
      .update(updatePayload)
      .eq('id', itemId)
      .eq('tenant_id', tenantId);

    if (error) throw error;
  } catch (err: any) {
    console.warn('Compliance item PATCH error:', err);
    throw new BadRequestError('Failed to update compliance item');
  }

  return NextResponse.json({
    success: true,
    message: `Compliance item status updated to ${complianceStatus || 'updated'}`,
    timestamp: new Date().toISOString()
  });
}, { requireAuth: true });

// DELETE handler: Archive/remove a compliance item
export const DELETE = withApiHandler(async (request, context) => {
  const user = context.auth!.user;
  const tenantId = user.tenantId;

  if (!tenantId) throw new BadRequestError('Tenant ID missing');

  const userRole = (user.role || '').toLowerCase().replace(/[^a-z0-9_]/g, '');
  const canApprove = ['admin', 'hr_manager', 'project_manager'].includes(userRole);

  if (!canApprove) {
    throw new ForbiddenError('Insufficient permissions. Deleting compliance items requires Manager access.');
  }

  const url = new URL(request.url);
  const itemId = url.searchParams.get('itemId');

  if (!itemId) throw new BadRequestError('Compliance Item ID is required');

  const supabase = getAdminRouteSupabase();

  try {
    const { error } = await supabase
      .from('compliance_items')
      .delete()
      .eq('id', itemId)
      .eq('tenant_id', tenantId);

    if (error) throw error;
  } catch (err: any) {
    console.warn('Compliance item DELETE error:', err);
    throw new BadRequestError('Failed to delete compliance item');
  }

  return NextResponse.json({
    success: true,
    message: 'Compliance item deleted successfully',
    timestamp: new Date().toISOString()
  });
}, { requireAuth: true });
