import { NextResponse } from 'next/server';
import { withApiHandler } from '@/server/http/handler';
import { BadRequestError, NotFoundError } from '@/server/http/errors';
import { getAdminRouteSupabase, getCurrentSupabaseActor } from '@/server/supabase/route-helpers';
import { logAuditAction, publishDomainEvent } from '@/server/events/dispatcher';

export const GET = withApiHandler(async (request, context) => {
  const tenantId = context.auth?.user.tenantId;
  if (!tenantId) throw new BadRequestError('Tenant info required');

  const searchParams = new URL(request.url).searchParams;
  const employeeId = searchParams.get('employee_id');
  const status = searchParams.get('status'); // 'pending' | 'approved' | 'rejected'

  const supabase = getAdminRouteSupabase();

  let query = supabase
    .from('attendance_overtime_requests')
    .select(`
      *,
      employees(id, employee_id, department, user_id)
    `)
    .eq('tenant_id', tenantId);

  if (employeeId) query = query.eq('employee_id', Number(employeeId));
  if (status) query = query.eq('status', status);

  const { data: overtime, error } = await query.order('created_at', { ascending: false });

  if (error) throw error;

  return NextResponse.json(overtime);
}, { requireAuth: true, roles: ['Employee', 'Admin', 'Manager'] });

export const POST = withApiHandler(async (request, context) => {
  const { employeeId, date, hours, reason } = await request.json();
  if (!employeeId || !date || !hours || !reason) {
    throw new BadRequestError('employeeId, date, hours, and reason are required');
  }

  const tenantId = context.auth?.user.tenantId;
  const accessToken = context.auth?.accessToken;
  if (!tenantId || !accessToken) throw new BadRequestError('Authorization and tenant info required');

  const supabase = getAdminRouteSupabase();
  const actor = await getCurrentSupabaseActor(accessToken);

  const overtimeMins = Math.round(Number(hours) * 60);

  const { data: requestRow, error } = await supabase
    .from('attendance_overtime_requests')
    .insert({
      tenant_id: tenantId,
      employee_id: Number(employeeId),
      date,
      calculated_overtime_minutes: overtimeMins,
      approved_overtime_minutes: null,
      status: 'pending',
      reason,
    })
    .select('*')
    .single();

  if (error || !requestRow) throw error ?? new Error('Failed to submit overtime claim');

  // Trigger SOC2 log
  const clientIp = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip');
  const userAgent = request.headers.get('user-agent');
  await logAuditAction(supabase, {
    tenantId,
    actorId: actor.legacyUserId ? String(actor.legacyUserId) : null,
    actionType: 'policy_update', // Map to general audit event
    clientIp,
    userAgent,
    metadata: { overtimeRequestId: requestRow.id, date, minutes: overtimeMins }
  });

  return NextResponse.json({ success: true, request: requestRow }, { status: 201 });
}, { requireAuth: true, roles: ['Employee', 'Admin', 'Manager'] });

export const PATCH = withApiHandler(async (request, context) => {
  const { id, action, approvedHours } = await request.json(); // action: 'approve' | 'reject', approvedHours?: number
  const tenantId = context.auth?.user.tenantId;
  const accessToken = context.auth?.accessToken;
  if (!tenantId || !accessToken) throw new BadRequestError('Authorization and tenant info required');

  const supabase = getAdminRouteSupabase();
  const actor = await getCurrentSupabaseActor(accessToken);

  // Fetch overtime request
  const { data: overtimeRequest } = await supabase
    .from('attendance_overtime_requests')
    .select('*')
    .eq('id', id)
    .eq('tenant_id', tenantId)
    .single();

  if (!overtimeRequest) throw new NotFoundError('Overtime request not found');

  const status = action === 'approve' ? 'approved' : 'rejected';
  const approvedOvertimeMinutes = action === 'approve' && approvedHours ? Math.round(approvedHours * 60) : overtimeRequest.calculated_overtime_minutes;

  const { data: updated, error } = await supabase
    .from('attendance_overtime_requests')
    .update({
      status,
      approved_overtime_minutes: action === 'approve' ? approvedOvertimeMinutes : 0,
      approver_id: actor.legacyUserId,
      approved_at: new Date().toISOString(),
    })
    .eq('id', id)
    .eq('tenant_id', tenantId)
    .select('*')
    .single();

  if (error || !updated) throw error ?? new Error('Failed to update overtime request');

  // Trigger Events
  await publishDomainEvent(supabase, tenantId, status === 'approved' ? 'OvertimeApproved' : 'AttendanceRejected', {
    overtimeRequestId: overtimeRequest.id,
    employeeId: overtimeRequest.employee_id,
    date: overtimeRequest.date,
    minutes: approvedOvertimeMinutes,
  });

  // Log compliance audit trace
  const clientIp = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip');
  const userAgent = request.headers.get('user-agent');
  await logAuditAction(supabase, {
    tenantId,
    actorId: actor.legacyUserId ? String(actor.legacyUserId) : null,
    actionType: status === 'approved' ? 'overtime_approve' : 'regularize_reject',
    clientIp,
    userAgent,
    metadata: { overtimeRequestId: overtimeRequest.id, status, minutes: approvedOvertimeMinutes }
  });

  return NextResponse.json({ success: true, overtime: updated });
}, { requireAuth: true, roles: ['Admin', 'SuperAdmin', 'Manager'] });
