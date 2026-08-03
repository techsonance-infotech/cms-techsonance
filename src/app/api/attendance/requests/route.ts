import { NextResponse } from 'next/server';
import { withApiHandler } from '@/server/http/handler';
import { BadRequestError, NotFoundError } from '@/server/http/errors';
import { getAdminRouteSupabase, getCurrentSupabaseActor } from '@/server/supabase/route-helpers';
import { calculateAttendance } from '@/server/attendance/engine';
import { logAuditAction, publishDomainEvent } from '@/server/events/dispatcher';

export const GET = withApiHandler(async (request, context) => {
  const user = context.auth!.user;
  const isAdminLike = user.role === 'Admin' || user.role === 'SuperAdmin' || user.role === 'Manager';
  
  const accessToken = context.auth?.accessToken;
  const tenantId = context.auth?.user.tenantId;
  if (!accessToken || !tenantId) throw new BadRequestError('Authorization and tenant info required');
  
  const actor = await getCurrentSupabaseActor(accessToken);
  const supabase = getAdminRouteSupabase();

  let query = supabase.from('attendance_requests').select(`
    *,
    employees!inner(id, user_id, department)
  `).eq('tenant_id', tenantId);

  // If not admin, they can only see their own pending requests
  if (!isAdminLike) {
    query = query.eq('employees.user_id', actor.authUserId);
  }

  const { data, error } = await query.order('created_at', { ascending: false });
  if (error) throw error;

  const mappedData = (data || []).map(r => ({
    ...r,
    ai_fraud_check: r.ai_fraud_check ?? r.metadata?.ai_fraud_check,
    requested_time_in: r.requested_time_in ?? r.metadata?.requested_time_in,
    reason_type: r.reason_type ?? r.metadata?.reason_type,
    gps_latitude: r.gps_latitude ?? r.metadata?.gps_latitude,
    gps_longitude: r.gps_longitude ?? r.metadata?.gps_longitude
  }));

  return NextResponse.json(mappedData);
}, { requireAuth: true, roles: ['Employee'] });

export const PATCH = withApiHandler(async (request, context) => {
  const { id, action, rejection_reason } = await request.json(); // action: 'approve' | 'reject'
  const user = context.auth!.user;
  
  const accessToken = context.auth?.accessToken;
  const tenantId = context.auth?.user.tenantId;
  if (!accessToken || !tenantId) throw new BadRequestError('Authorization and tenant info required');
  
  if (!['approve', 'reject'].includes(action)) {
    throw new BadRequestError('Invalid action. Must be approve or reject');
  }

  const supabase = getAdminRouteSupabase();
  const actor = await getCurrentSupabaseActor(accessToken);

  // Fetch the request
  const { data: rawRequest, error: reqError } = await supabase
    .from('attendance_requests')
    .select('*, employees!inner(id, user_id)')
    .eq('id', id)
    .eq('tenant_id', tenantId)
    .single();

  if (reqError || !rawRequest) throw new NotFoundError('Attendance request not found');
  if (rawRequest.status !== 'pending') throw new BadRequestError('Request is not pending');

  const attendanceRequest = {
    ...rawRequest,
    ai_fraud_check: rawRequest.ai_fraud_check ?? rawRequest.metadata?.ai_fraud_check,
    requested_time_in: rawRequest.requested_time_in ?? rawRequest.metadata?.requested_time_in,
    reason_type: rawRequest.reason_type ?? rawRequest.metadata?.reason_type,
    gps_latitude: rawRequest.gps_latitude ?? rawRequest.metadata?.gps_latitude,
    gps_longitude: rawRequest.gps_longitude ?? rawRequest.metadata?.gps_longitude
  };

  const clientIp = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip');
  const userAgent = request.headers.get('user-agent');

  if (action === 'reject') {
    // 1. Update request status
    await supabase.from('attendance_requests').update({ 
      status: 'rejected',
      metadata: { ...attendanceRequest.metadata, rejection_reason, rejectedBy: actor.legacyUserId }
    }).eq('id', id);

    // 2. Notify employee
    await supabase.from('notifications').insert({
      user_id: attendanceRequest.employees.user_id,
      title: 'Attendance Request Rejected',
      message: `Your attendance request for ${attendanceRequest.date} was rejected. Reason: ${rejection_reason || 'None provided'}`,
      type: 'error',
      link: '/dashboard/attendance',
      is_read: false,
      tenant_id: tenantId,
      created_at: new Date().toISOString(),
    });

    // 3. Publish Event
    await publishDomainEvent(supabase, tenantId, 'AttendanceRejected', {
      requestId: id,
      employeeId: attendanceRequest.employee_id,
      date: attendanceRequest.date,
      reason: rejection_reason
    });

    // 4. Write Audit Log
    await logAuditAction(supabase, {
      tenantId,
      employeeId: attendanceRequest.employee_id,
      actorId: actor.legacyUserId ? String(actor.legacyUserId) : null,
      actionType: 'regularize_reject',
      clientIp,
      userAgent,
      metadata: { requestId: id, reason: rejection_reason }
    });

    return NextResponse.json({ success: true, message: 'Rejected successfully' });
  }

  if (action === 'approve') {
    // 1. Resolve actual calculations using the Attendance Engine
    const timeIn = attendanceRequest.requested_time_in || attendanceRequest.time_in;
    const timeOut = attendanceRequest.requested_time_out || attendanceRequest.time_out;

    const calc = await calculateAttendance(
      supabase,
      tenantId,
      Number(attendanceRequest.employee_id),
      attendanceRequest.date,
      timeIn,
      timeOut,
      attendanceRequest.metadata
    );

    // 2. Write to attendance_records
    const { data: createdRecord, error: insertError } = await supabase.from('attendance_records').insert({
      employee_id: attendanceRequest.employee_id,
      date: attendanceRequest.date,
      time_in: timeIn,
      time_out: timeOut,
      duration: calc.totalHours * 60,
      status: calc.status,
      check_in_method: attendanceRequest.check_in_method || 'manual',
      location: attendanceRequest.location,
      reader_id: attendanceRequest.reader_id,
      tag_uid: null,
      location_latitude: attendanceRequest.gps_latitude ?? null,
      location_longitude: attendanceRequest.gps_longitude ?? null,
      idempotency_key: null,
      synced_at: null,
      metadata: { 
        ...attendanceRequest.metadata, 
        notes: attendanceRequest.notes, 
        productiveHours: calc.productiveHours,
        approvedBy: actor.legacyUserId,
        regularized: true
      },
      tenant_id: tenantId,
      created_at: new Date().toISOString(),
    }).select('*').single();

    if (insertError || !createdRecord) throw insertError ?? new Error('Failed to migrate approved record to attendance_records');

    // 3. Mark request as approved
    await supabase.from('attendance_requests').update({ status: 'approved' }).eq('id', id);

    // 4. Trigger Overtime request if calculated overtime > 0
    if (calc.overtimeMinutes > 0) {
      await supabase.from('attendance_overtime_requests').insert({
        tenant_id: tenantId,
        employee_id: attendanceRequest.employee_id,
        date: attendanceRequest.date,
        calculated_overtime_minutes: calc.overtimeMinutes,
        approved_overtime_minutes: null,
        status: 'pending',
        reason: 'Auto-calculated overtime via regularization approval',
        created_at: new Date().toISOString(),
      });
    }

    // 5. Notify employee
    await supabase.from('notifications').insert({
      user_id: attendanceRequest.employees.user_id,
      title: 'Attendance Request Approved',
      message: `Your attendance request for ${attendanceRequest.date} was approved! Status: ${calc.status}.`,
      type: 'success',
      link: '/dashboard/attendance',
      is_read: false,
      tenant_id: tenantId,
      created_at: new Date().toISOString(),
    });

    // 6. Publish Events
    await publishDomainEvent(supabase, tenantId, 'AttendanceApproved', {
      requestId: id,
      recordId: createdRecord.id,
      employeeId: attendanceRequest.employee_id,
      date: attendanceRequest.date,
      status: calc.status
    });

    await publishDomainEvent(supabase, tenantId, 'AttendanceCorrected', {
      employeeId: attendanceRequest.employee_id,
      date: attendanceRequest.date,
      timeIn,
      timeOut
    });

    // 7. Write Audit Log
    await logAuditAction(supabase, {
      tenantId,
      employeeId: attendanceRequest.employee_id,
      actorId: actor.legacyUserId ? String(actor.legacyUserId) : null,
      actionType: 'regularize_approve',
      recordId: Number(createdRecord.id),
      clientIp,
      userAgent,
      metadata: { requestId: id, resolvedStatus: calc.status }
    });

    return NextResponse.json({ success: true, message: 'Approved successfully' });
  }

  return NextResponse.json({ success: false, message: 'No action taken' });
}, { requireAuth: true, roles: ['Admin', 'SuperAdmin', 'Manager'] });

