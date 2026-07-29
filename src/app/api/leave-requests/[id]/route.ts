import { NextRequest, NextResponse } from 'next/server';
import { withApiHandler } from '@/server/http/handler';
import { BadRequestError, ForbiddenError, NotFoundError, UnprocessableEntityError } from '@/server/http/errors';
import { updateLeaveRequestSchema } from '@/server/validation/hr';
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
    .single();
  return employee ?? null;
}

function normalizeSupabaseLeaveRequestRow(
  row: Record<string, unknown>,
  userMap: Map<string, number | null>
) {
  const approvedBy = typeof row.approved_by === 'string' ? userMap.get(row.approved_by) ?? null : null;
  return {
    id: Number(row.id),
    employeeId: Number(row.employee_id),
    leaveType: row.leave_type,
    startDate: row.start_date,
    endDate: row.end_date,
    reason: row.reason,
    status: row.status,
    leavePeriod: row.leave_period,
    actualDays: row.actual_days,
    approvedBy,
    createdAt: row.created_at ?? null,
    updatedAt: row.updated_at ?? null,
  };
}

export const PATCH = withApiHandler(async (request: Request, context) => {
  const dynamicParams = (context as any).params;
  const resolvedParams = typeof dynamicParams?.then === 'function' ? await dynamicParams : dynamicParams;
  const id = Number(resolvedParams?.id);

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
  const { data: updated, error } = await supabase.from('leave_requests').update({
    ...(payload.leaveType !== undefined ? { leave_type: payload.leaveType } : {}),
    ...(payload.startDate !== undefined ? { start_date: payload.startDate } : {}),
    ...(payload.endDate !== undefined ? { end_date: payload.endDate } : {}),
    ...(payload.reason !== undefined ? { reason: payload.reason.trim() } : {}),
    ...(payload.leavePeriod !== undefined ? { leave_period: payload.leavePeriod } : {}),
    ...(payload.actualDays !== undefined ? { actual_days: payload.actualDays } : {}),
    ...(payload.status !== undefined
      ? { status: payload.status, approved_by: isAdminLike && payload.status === 'approved' ? actor.authUserId : existing.approved_by }
      : {}),
    updated_at: new Date().toISOString(),
  })
  .eq('id', id)
  .eq('tenant_id', tenantId)
  .select('*')
  .single();
  if (error || !updated) throw error ?? new Error('Failed to update leave request');
  const userMap = await buildLegacyUserIdMap(accessToken, [updated.approved_by].filter(Boolean).map(String), tenantId);
  return NextResponse.json(normalizeSupabaseLeaveRequestRow(updated, userMap));
}, { requireAuth: true, roles: ['Employee'] });

export const DELETE = withApiHandler(async (request: Request, context) => {
  const dynamicParams = (context as any).params;
  const resolvedParams = typeof dynamicParams?.then === 'function' ? await dynamicParams : dynamicParams;
  const id = Number(resolvedParams?.id);

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
