import { NextResponse } from 'next/server';
import { withApiHandler } from '@/server/http/handler';
import { BadRequestError, ForbiddenError, NotFoundError, UnprocessableEntityError } from '@/server/http/errors';
import { createLeaveRequestSchema, updateLeaveRequestSchema } from '@/server/validation/hr';
import {
  buildLegacyUserIdMap,
  getCurrentSupabaseActor,
  getAdminRouteSupabase,
} from '@/server/supabase/route-helpers';

async function getCurrentSupabaseEmployee(tenantId: string, authUserId: string) {
  const supabase = getAdminRouteSupabase();
  const { data: employee } = await supabase
    .from('employees')
    .select('id')
    .eq('user_id', authUserId)
    .eq('tenant_id', tenantId)
    .maybeSingle();
  return employee ?? null;
}

let leaveRequestsColumnsCache: Set<string> | null = null;
async function getLeaveRequestsColumns(supabase: any): Promise<Set<string>> {
  if (leaveRequestsColumnsCache) return leaveRequestsColumnsCache;
  const { data, error } = await supabase.from('leave_requests').select('*').limit(1);
  if (!error && data && data.length > 0) {
    leaveRequestsColumnsCache = new Set(Object.keys(data[0]));
    return leaveRequestsColumnsCache;
  }
  const standardCols = [
    'id', 'tenant_id', 'employee_id', 'leave_type', 'start_date', 'end_date',
    'reason', 'status', 'leave_period', 'actual_days', 'approved_by', 'created_at', 'updated_at'
  ];
  const cols = new Set<string>(standardCols);
  try {
    const { error: aErr } = await supabase.from('leave_requests').select('attachment_url').limit(1);
    if (!aErr) cols.add('attachment_url');
  } catch {}
  try {
    const { error: anErr } = await supabase.from('leave_requests').select('attachment_name').limit(1);
    if (!anErr) cols.add('attachment_name');
  } catch {}
  leaveRequestsColumnsCache = cols;
  return leaveRequestsColumnsCache;
}

function normalizeSupabaseLeaveRequestRow(
  row: Record<string, unknown>,
  userMap: Map<string, number | null>
) {
  const approvedBy = typeof row.approved_by === 'string' ? userMap.get(row.approved_by) ?? null : null;
  let attachmentUrl = (row.attachment_url as string | null) ?? null;
  let attachmentName = (row.attachment_name as string | null) ?? null;

  const rawReason = String(row.reason ?? '');
  if (!attachmentUrl) {
    const match = rawReason.match(/\n\n\[Attachment:\s*(.*?)\s*\|\s*(.*?)\]$/);
    if (match) {
      attachmentName = match[1];
      attachmentUrl = match[2];
    }
  }

  const cleanReason = rawReason.replace(/\n\n\[Attachment:\s*.*?\s*\|\s*.*?\]$/, '').trim();

  return {
    id: Number(row.id),
    employeeId: Number(row.employee_id),
    leaveType: row.leave_type,
    startDate: row.start_date,
    endDate: row.end_date,
    reason: cleanReason,
    status: row.status,
    leavePeriod: row.leave_period,
    actualDays: row.actual_days,
    approvedBy,
    attachmentUrl,
    attachmentName,
    createdAt: row.created_at ?? null,
    updatedAt: row.updated_at ?? null,
  };
}

export const GET = withApiHandler(async (request, context) => {
  const user = context.auth!.user;
  const isAdminLike = user.role === 'Admin' || user.role === 'SuperAdmin' || user.role === 'Manager';
  const searchParams = new URL(request.url).searchParams;
  const id = searchParams.get('id');

  const accessToken = context.auth?.accessToken;
  const tenantId = context.auth?.user.tenantId;
  if (!accessToken || !tenantId) throw new BadRequestError('Authorization and tenant info required');
  
  const actor = await getCurrentSupabaseActor(accessToken);
  const supabase = getAdminRouteSupabase();

  if (id) {
    const leaveRequestId = Number(id);
    if (!Number.isInteger(leaveRequestId) || leaveRequestId <= 0) {
      throw new BadRequestError('Valid leave request id is required');
    }
    const { data: leaveRequest, error } = await supabase
      .from('leave_requests')
      .select('*')
      .eq('id', leaveRequestId)
      .eq('tenant_id', tenantId)
      .single();
    if (error || !leaveRequest) throw new NotFoundError('Leave request not found');
    if (!isAdminLike) {
      const employee = await getCurrentSupabaseEmployee(tenantId, actor.authUserId);
      if (!employee || Number(employee.id) !== Number(leaveRequest.employee_id)) throw new ForbiddenError('Unauthorized');
    }
    const approvedByIds = leaveRequest.approved_by && typeof leaveRequest.approved_by === 'string'
      ? [leaveRequest.approved_by]
      : [];
    const userMap = await buildLegacyUserIdMap(accessToken, approvedByIds, tenantId);
    return NextResponse.json(normalizeSupabaseLeaveRequestRow(leaveRequest, userMap));
  }
  const limit = Math.min(Number(searchParams.get('limit') ?? '10'), 100);
  const offset = Math.max(Number(searchParams.get('offset') ?? '0'), 0);
  const employeeIdParam = searchParams.get('employeeId');
  const leaveType = searchParams.get('leaveType');
  const status = searchParams.get('status');
  const startDate = searchParams.get('startDate');
  const endDate = searchParams.get('endDate');
  
  let query = supabase
    .from('leave_requests')
    .select('*', { count: 'exact' })
    .eq('tenant_id', tenantId);
    
  if (!isAdminLike) {
    const employee = await getCurrentSupabaseEmployee(tenantId, actor.authUserId);
    if (!employee) return NextResponse.json([]);
    query = query.eq('employee_id', employee.id);
  } else if (employeeIdParam) {
    query = query.eq('employee_id', Number(employeeIdParam));
  }
  if (leaveType) query = query.eq('leave_type', leaveType);
  if (status) query = query.eq('status', status);
  if (startDate) query = query.gte('start_date', startDate);
  if (endDate) query = query.lte('end_date', endDate);
  const { data, count, error } = await query.order('created_at', { ascending: false }).range(offset, offset + limit - 1);
  if (error) throw error;
  const rows = (data as Record<string, unknown>[] | null) ?? [];
  const approvedByIds = rows
    .map((row) => row.approved_by)
    .filter((approvedBy): approvedBy is string => typeof approvedBy === 'string' && approvedBy !== 'null' && approvedBy !== 'undefined');
  const userMap = await buildLegacyUserIdMap(accessToken, approvedByIds, tenantId);
  return NextResponse.json({
    success: true,
    data: rows.map((row) => normalizeSupabaseLeaveRequestRow(row, userMap)),
    message: 'Leave requests fetched successfully',
    errors: null,
    meta: { page: Math.floor(offset / limit) + 1, limit, total: Number(count ?? 0) },
  });
}, { requireAuth: true, roles: ['Employee'] });

export const POST = withApiHandler(async (request, context) => {
  const payload = createLeaveRequestSchema.parse(await request.json());
  const user = context.auth!.user;
  const roleStr = String(user.role || '').toLowerCase();
  const isAdminLike = ['admin', 'superadmin', 'super_admin', 'manager', 'owner', 'hr_manager'].includes(roleStr);

  const cleanDate = (d: string) => {
    if (d.includes('T')) return d.split('T')[0];
    if (/^\d{2}-\d{2}-\d{4}$/.test(d)) {
      const [day, month, year] = d.split('-');
      return `${year}-${month}-${day}`;
    }
    return d;
  };
  const startDate = cleanDate(payload.startDate);
  const endDate = cleanDate(payload.endDate);

  if (new Date(startDate) > new Date(endDate)) {
    throw new UnprocessableEntityError('Start date must be before or on end date');
  }

  const accessToken = context.auth?.accessToken;
  const tenantId = context.auth?.user.tenantId;
  if (!accessToken || !tenantId) throw new BadRequestError('Authorization and tenant info required');
  
  const actor = await getCurrentSupabaseActor(accessToken);
  const supabase = getAdminRouteSupabase();

  let employeeId = (isAdminLike && payload.employeeId && payload.employeeId > 0)
    ? payload.employeeId
    : (await getCurrentSupabaseEmployee(tenantId, actor.authUserId))?.id;

  if (!employeeId && (context.auth?.user as any)?.employeeRecordId) {
    employeeId = (context.auth!.user as any).employeeRecordId;
  }

  if (!employeeId) {
    // Self-heal: auto-provision employee record if user has none
    const { data: newEmp } = await supabase
      .from('employees')
      .insert({
        tenant_id: tenantId,
        user_id: actor.authUserId,
        employee_id: `EMP-${Math.floor(Math.random() * 9000 + 1000)}`,
        department: 'General',
        designation: user.role || 'Staff Member',
        date_of_joining: new Date().toISOString().split('T')[0],
        status: 'active'
      })
      .select('id')
      .maybeSingle();

    if (newEmp) {
      employeeId = newEmp.id;
    }
  }

  if (!employeeId) throw new NotFoundError('Employee record not found for current user');

  const { data: employee } = await supabase
    .from('employees')
    .select('id')
    .eq('id', employeeId)
    .eq('tenant_id', tenantId)
    .maybeSingle();

  if (!employee) throw new NotFoundError('Employee not found in this tenant');

  const now = new Date().toISOString();
  const dbCols = await getLeaveRequestsColumns(supabase);

  // If DB doesn't have attachment_url column, embed attachment in reason so it is never lost
  let finalReason = payload.reason.trim();
  if (!dbCols.has('attachment_url') && payload.attachmentUrl) {
    finalReason = `${finalReason}\n\n[Attachment: ${payload.attachmentName || 'Document'} | ${payload.attachmentUrl}]`;
  }

  const insertPayload: Record<string, any> = {
    employee_id: employeeId,
    leave_type: payload.leaveType,
    start_date: startDate,
    end_date: endDate,
    reason: finalReason,
    status: 'pending',
    leave_period: payload.leavePeriod ?? 'full_day',
    actual_days: payload.actualDays ?? 1,
    approved_by: null,
    tenant_id: tenantId,
    created_at: now,
    updated_at: now,
  };

  if (dbCols.has('attachment_url')) {
    insertPayload.attachment_url = payload.attachmentUrl ?? null;
  }
  if (dbCols.has('attachment_name')) {
    insertPayload.attachment_name = payload.attachmentName ?? null;
  }

  const { data: created, error } = await supabase
    .from('leave_requests')
    .insert(insertPayload)
    .select('*')
    .single();

  if (error || !created) throw error ?? new Error('Failed to create leave request');
  return NextResponse.json(normalizeSupabaseLeaveRequestRow(created, new Map()), { status: 201 });
}, { requireAuth: true, roles: ['Employee'] });

export const PUT = withApiHandler(async (request, context) => {
  const id = Number(new URL(request.url).searchParams.get('id'));
  if (!Number.isInteger(id) || id <= 0) throw new BadRequestError('Valid leave request id is required');
  const payload = updateLeaveRequestSchema.parse(await request.json());
  const user = context.auth!.user;
  const isAdminLike = user.role === 'Admin' || user.role === 'SuperAdmin' || user.role === 'Manager';

  const accessToken = context.auth?.accessToken;
  const tenantId = context.auth?.user.tenantId;
  if (!accessToken || !tenantId) throw new BadRequestError('Authorization and tenant info required');
  
  const actor = await getCurrentSupabaseActor(accessToken);
  const supabase = getAdminRouteSupabase();
  const { data: existing } = await supabase
    .from('leave_requests')
    .select('*')
    .eq('id', id)
    .eq('tenant_id', tenantId)
    .single();
    
  if (!existing) throw new NotFoundError('Leave request not found');
  if (!isAdminLike) {
    const employee = await getCurrentSupabaseEmployee(tenantId, actor.authUserId);
    if (!employee || Number(employee.id) !== Number(existing.employee_id)) throw new ForbiddenError('Unauthorized');
    if (existing.status !== 'pending') throw new BadRequestError('Only pending leave requests can be modified');
  }
  const nextStart = payload.startDate ?? String(existing.start_date);
  const nextEnd = payload.endDate ?? String(existing.end_date);
  if (new Date(nextStart) > new Date(nextEnd)) throw new UnprocessableEntityError('Start date must be before end date');
  const dbCols = await getLeaveRequestsColumns(supabase);
  let updatedReason = payload.reason !== undefined ? payload.reason.trim() : undefined;
  if (!dbCols.has('attachment_url') && payload.attachmentUrl) {
    const base = updatedReason ?? String(existing.reason ?? '');
    updatedReason = `${base.replace(/\n\n\[Attachment:\s*.*?\s*\|\s*.*?\]$/, '')}\n\n[Attachment: ${payload.attachmentName || 'Document'} | ${payload.attachmentUrl}]`;
  }

  const updateFields: Record<string, any> = {
    ...(payload.leaveType !== undefined ? { leave_type: payload.leaveType } : {}),
    ...(payload.startDate !== undefined ? { start_date: payload.startDate } : {}),
    ...(payload.endDate !== undefined ? { end_date: payload.endDate } : {}),
    ...(updatedReason !== undefined ? { reason: updatedReason } : {}),
    ...(payload.leavePeriod !== undefined ? { leave_period: payload.leavePeriod } : {}),
    ...(payload.actualDays !== undefined ? { actual_days: payload.actualDays } : {}),
    ...(payload.status !== undefined
      ? { status: payload.status, approved_by: isAdminLike && payload.status === 'approved' ? actor.authUserId : existing.approved_by }
      : {}),
    updated_at: new Date().toISOString(),
  };

  if (dbCols.has('attachment_url') && payload.attachmentUrl !== undefined) {
    updateFields.attachment_url = payload.attachmentUrl ?? null;
  }
  if (dbCols.has('attachment_name') && payload.attachmentName !== undefined) {
    updateFields.attachment_name = payload.attachmentName ?? null;
  }

  const { data: updated, error } = await supabase.from('leave_requests').update(updateFields)
  .eq('id', id)
  .eq('tenant_id', tenantId)
  .select('*')
  .single();
  if (error || !updated) throw error ?? new Error('Failed to update leave request');
  const userMap = await buildLegacyUserIdMap(accessToken, [updated.approved_by].filter(Boolean).map(String), tenantId);
  return NextResponse.json(normalizeSupabaseLeaveRequestRow(updated, userMap));
}, { requireAuth: true, roles: ['Employee'] });

export const DELETE = withApiHandler(async (request, context) => {
  const id = Number(new URL(request.url).searchParams.get('id'));
  if (!Number.isInteger(id) || id <= 0) throw new BadRequestError('Valid leave request id is required');
  const user = context.auth!.user;
  const isAdminLike = user.role === 'Admin' || user.role === 'SuperAdmin' || user.role === 'Manager';

  const accessToken = context.auth?.accessToken;
  const tenantId = context.auth?.user.tenantId;
  if (!accessToken || !tenantId) throw new BadRequestError('Authorization and tenant info required');
  
  const actor = await getCurrentSupabaseActor(accessToken);
  const supabase = getAdminRouteSupabase();
  const { data: existing } = await supabase
    .from('leave_requests')
    .select('*')
    .eq('id', id)
    .eq('tenant_id', tenantId)
    .single();
    
  if (!existing) throw new NotFoundError('Leave request not found');
  if (!isAdminLike) {
    const employee = await getCurrentSupabaseEmployee(tenantId, actor.authUserId);
    if (!employee || Number(employee.id) !== Number(existing.employee_id)) throw new ForbiddenError('Unauthorized');
    if (existing.status !== 'pending') throw new BadRequestError('Only pending leave requests can be deleted');
  }
  const { data: deleted, error } = await supabase
    .from('leave_requests')
    .delete()
    .eq('id', id)
    .eq('tenant_id', tenantId)
    .select('*')
    .single();
  if (error || !deleted) throw error ?? new Error('Failed to delete leave request');
  const userMap = await buildLegacyUserIdMap(accessToken, [deleted.approved_by].filter(Boolean).map(String), tenantId);
  return NextResponse.json({ message: 'Leave request deleted successfully', leaveRequest: normalizeSupabaseLeaveRequestRow(deleted, userMap) });
}, { requireAuth: true, roles: ['Employee'] });
