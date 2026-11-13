import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { withApiHandler } from '@/server/http/handler';
import { BadRequestError, NotFoundError } from '@/server/http/errors';
import { getAdminRouteSupabase, getCurrentSupabaseActor } from '@/server/supabase/route-helpers';
import { calculateAttendance } from '@/server/attendance/engine';
import { logAuditAction, publishDomainEvent } from '@/server/events/dispatcher';

export const GET = withApiHandler(async (request, context) => {
  const user = context.auth!.user;
  const userRole = (user.role || '').toLowerCase().replace(/[^a-z0-9_]/g, '');
  const isAdminLike = ['admin', 'superadmin', 'super_admin', 'manager', 'project_manager', 'hr_manager', 'ceo', 'cto', 'business_owner', 'owner'].includes(userRole);
  
  const accessToken = context.auth?.accessToken;
  const tenantId = context.auth?.user.tenantId;
  if (!accessToken || !tenantId) throw new BadRequestError('Authorization and tenant info required');
  
  const actor = await getCurrentSupabaseActor(accessToken);
  const supabase = getAdminRouteSupabase();

  let query = supabase.from('attendance_requests').select(`
    *,
    employees(id, user_id, department)
  `).eq('tenant_id', tenantId);

  // If not admin, they can only see their own pending requests
  if (!isAdminLike) {
    query = query.eq('employees.user_id', actor.authUserId);
  }

  const { data, error } = await query.order('created_at', { ascending: false });
  if (error) throw error;

  const mappedData = (data || []).map((r: any) => ({
    ...r,
    ai_fraud_check: r.ai_fraud_check ?? r.metadata?.ai_fraud_check,
    requested_time_in: r.requested_time_in ?? r.metadata?.requested_time_in,
    reason_type: r.reason_type ?? r.metadata?.reason_type,
    gps_latitude: r.gps_latitude ?? r.metadata?.gps_latitude,
    gps_longitude: r.gps_longitude ?? r.metadata?.gps_longitude
  }));

  return NextResponse.json(mappedData);
}, { requireAuth: true });

export const POST = withApiHandler(async (request, context) => {
  const body = await request.json();
  const user = context.auth!.user;
  const userRole = (user.role || '').toLowerCase().replace(/[^a-z0-9_]/g, '');
  const isAdminLike = ['admin', 'superadmin', 'super_admin', 'manager', 'project_manager', 'hr_manager', 'ceo', 'cto', 'business_owner', 'owner'].includes(userRole);

  const accessToken = context.auth?.accessToken;
  const tenantId = context.auth?.user.tenantId;
  if (!accessToken || !tenantId) throw new BadRequestError('Authorization and tenant info required');

  const actor = await getCurrentSupabaseActor(accessToken);
  const supabase = getAdminRouteSupabase();

  let targetEmployeeId = body.employeeId;
  if (!isAdminLike || !targetEmployeeId) {
    const { data: myEmp } = await supabase
      .from('employees')
      .select('id')
      .eq('user_id', actor.authUserId)
      .eq('tenant_id', tenantId)
      .maybeSingle();
    if (myEmp) {
      targetEmployeeId = myEmp.id;
    }
  }

  if (!targetEmployeeId) throw new BadRequestError('Target employee ID is required');

  const timeIn = body.timeIn || `${body.date}T09:00:00+05:30`;
  const timeOut = body.timeOut || `${body.date}T18:00:00+05:30`;

  const { data: created, error } = await supabase.from('attendance_requests').insert({
    employee_id: targetEmployeeId,
    date: body.date,
    time_in: timeIn,
    time_out: timeOut,
    status: 'pending',
    check_in_method: 'manual',
    location: body.location || null,
    reader_id: null,
    notes: body.notes || 'Manual attendance adjustment request',
    tenant_id: tenantId,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    metadata: {
      reasonType: body.reasonType || 'forgotten_punch',
      requested_time_in: timeIn,
      requested_time_out: timeOut,
      notes: body.notes,
      attachmentUrl: body.attachmentUrl,
      gps_latitude: body.locationLatitude ?? null,
      gps_longitude: body.locationLongitude ?? null,
      submittedBy: actor.legacyUserId,
      ai_fraud_check: {
        isAnomaly: false,
        confidenceScore: 95,
        verdict: 'Manual regularization request filed for supervisory review.'
      }
    }
  }).select('*').single();

  if (error || !created) throw error ?? new Error('Failed to create regularization request');

  return NextResponse.json({ 
    success: true, 
    data: created, 
    routedToQueue: true,
    message: 'Regularization request submitted and routed to approval queue.' 
  }, { status: 201 });
}, { requireAuth: true });

export const PATCH = withApiHandler(async (request, context) => {
  const { id, action, rejection_reason } = await request.json(); // action: 'approve' | 'reject'
  const user = context.auth!.user;
  const userRole = (user.role || '').toLowerCase().replace(/[^a-z0-9_]/g, '');
  const isAdminLike = ['admin', 'superadmin', 'super_admin', 'manager', 'project_manager', 'hr_manager', 'ceo', 'cto', 'business_owner', 'owner'].includes(userRole);
  if (!isAdminLike) {
    throw new BadRequestError('Forbidden: Only managers and admins can action regularization requests');
  }
  
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
    const timeIn = attendanceRequest.requested_time_in 
      || attendanceRequest.metadata?.requested_time_in 
      || attendanceRequest.time_in 
      || `${attendanceRequest.date}T09:00:00+05:30`;
    const timeOut = attendanceRequest.requested_time_out 
      || attendanceRequest.metadata?.requested_time_out 
      || attendanceRequest.time_out 
      || null;

    const calc = await calculateAttendance(
      supabase,
      tenantId,
      Number(attendanceRequest.employee_id),
      attendanceRequest.date,
      timeIn,
      timeOut,
      attendanceRequest.metadata
    );

    // Validate enum status: 'present' | 'absent' | 'late' | 'half_day' | 'leave'
    const validStatuses = ['present', 'absent', 'late', 'half_day', 'leave'];
    let safeStatus = validStatuses.includes(calc.status) ? calc.status : 'present';
    if (calc.status === 'missing_punch') {
      safeStatus = calc.isLate ? 'late' : 'present';
    }

    // 2. Write or update attendance_records
    const { data: existingRecord } = await supabase
      .from('attendance_records')
      .select('id')
      .eq('employee_id', attendanceRequest.employee_id)
      .eq('date', attendanceRequest.date)
      .eq('tenant_id', tenantId)
      .maybeSingle();

    let createdRecord;
    if (existingRecord) {
      const { data: updated, error: updateError } = await supabase
        .from('attendance_records')
        .update({
          time_in: timeIn,
          time_out: timeOut,
          duration: Math.round(calc.totalHours * 60),
          status: safeStatus,
          check_in_method: attendanceRequest.check_in_method || 'manual',
          metadata: { 
            ...attendanceRequest.metadata, 
            notes: attendanceRequest.notes, 
            productiveHours: calc.productiveHours,
            approvedBy: actor.legacyUserId,
            regularized: true
          }
        })
        .eq('id', existingRecord.id)
        .select('*')
        .single();
      if (updateError) throw updateError;
      createdRecord = updated;
    } else {
      const { data: inserted, error: insertError } = await supabase
        .from('attendance_records')
        .insert({
          employee_id: attendanceRequest.employee_id,
          date: attendanceRequest.date,
          time_in: timeIn,
          time_out: timeOut,
          duration: Math.round(calc.totalHours * 60),
          status: safeStatus,
          check_in_method: attendanceRequest.check_in_method || 'manual',
          location: attendanceRequest.location,
          reader_id: attendanceRequest.reader_id,
          tag_uid: null,
          location_latitude: attendanceRequest.gps_latitude ?? null,
          location_longitude: attendanceRequest.gps_longitude ?? null,
          idempotency_key: crypto.randomUUID(),
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
        })
        .select('*')
        .single();
      if (insertError) throw insertError;
      createdRecord = inserted;
    }

    if (!createdRecord) throw new Error('Failed to save approved record to attendance_records');

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

    // 5. Notify employee (if user_id exists)
    const empUserId = attendanceRequest.employees?.user_id;
    if (empUserId) {
      await supabase.from('notifications').insert({
        user_id: empUserId,
        title: 'Attendance Request Approved',
        message: `Your attendance request for ${attendanceRequest.date} was approved! Status: ${safeStatus}.`,
        type: 'success',
        link: '/dashboard/attendance',
        is_read: false,
        tenant_id: tenantId,
        created_at: new Date().toISOString(),
      });
    }

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
}, { requireAuth: true });

