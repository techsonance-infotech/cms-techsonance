import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { withApiHandler } from '@/server/http/handler';
import { BadRequestError, ConflictError, NotFoundError } from '@/server/http/errors';
import { checkInSchema } from '@/server/validation/attendance';
import { getCurrentSupabaseActor, getAdminRouteSupabase } from '@/server/supabase/route-helpers';
import { listSupabaseProfilesByAuthIds } from '@/server/supabase/users';
import { getPolicyForEmployee, getShiftForEmployee, applyRounding, parseShiftTime } from '@/server/attendance/engine';
import { detectAttendanceAnomaly } from '@/server/ai/attendance-anomaly';
import { logAuditAction, publishDomainEvent } from '@/server/events/dispatcher';

async function resolveSupabaseEmployee(accessToken: string, tenantId: string, tagUid?: string | null, employeeId?: number | null) {
  const supabase = getAdminRouteSupabase();
  if (tagUid) {
    const { data: tag } = await supabase
      .from('nfc_tags')
      .select('*')
      .eq('tag_uid', tagUid)
      .eq('tenant_id', tenantId)
      .single();
    if (!tag) throw new NotFoundError('NFC tag not found');
    if (tag.status !== 'active') throw new ConflictError('NFC tag is not active');
    if (!tag.employee_id) throw new ConflictError('NFC tag is not assigned to any employee');
    return { employeeId: Number(tag.employee_id), checkInMethod: 'nfc' as const, tag };
  }
  if (!employeeId) throw new BadRequestError('Either tagUid or employeeId must be provided');
  return { employeeId, checkInMethod: 'manual' as const, tag: null };
}

export const POST = withApiHandler(async (request, context) => {
  const payload = checkInSchema.parse(await request.json());
  const accessToken = context.auth?.accessToken;
  const tenantId = context.auth?.user.tenantId;
  if (!accessToken || !tenantId) throw new BadRequestError('Authorization and tenant info required');
  
  const actor = await getCurrentSupabaseActor(accessToken);
  const supabase = getAdminRouteSupabase();

  if (payload.idempotencyKey) {
    const { data: existingByKey } = await supabase
      .from('attendance_records')
      .select('*')
      .eq('idempotency_key', payload.idempotencyKey)
      .eq('tenant_id', tenantId)
      .maybeSingle();
    if (existingByKey) {
      return NextResponse.json({ ...existingByKey, message: 'Check-in already processed (idempotency)' });
    }
  }

  const resolved = await resolveSupabaseEmployee(accessToken, tenantId, payload.tagUid, payload.employeeId);
  const { data: employee } = await supabase
    .from('employees')
    .select('*')
    .eq('id', resolved.employeeId)
    .eq('tenant_id', tenantId)
    .single();
  if (!employee) throw new NotFoundError('Employee not found');
  const profiles = await listSupabaseProfilesByAuthIds([String(employee.user_id)], { accessToken, tenantId, useAdmin: true });
  const profile = profiles.get(String(employee.user_id));
  const employeeView = {
    id: Number(employee.id),
    name: `${profile?.first_name ?? ''} ${profile?.last_name ?? ''}`.trim(),
    email: profile?.email ?? null,
    department: employee.department,
    photoUrl: profile?.avatar_url ?? null,
  };

  const isAdminLike = actor.role === 'Admin' || actor.role === 'SuperAdmin' || actor.role === 'Manager';
  if (!isAdminLike && String(employee.user_id) !== actor.authUserId) {
    throw new BadRequestError('Insufficient permissions. You can only log your own attendance.');
  }

  const nowDate = new Date();
  const today = nowDate.toISOString().split('T')[0];
  const minuteStart = new Date(nowDate);
  minuteStart.setSeconds(0, 0);
  const minuteEnd = new Date(minuteStart.getTime() + 60_000);
  
  const { data: sameMinuteRecord } = await supabase.from('attendance_records').select('*')
    .eq('employee_id', resolved.employeeId)
    .eq('date', today)
    .eq('tenant_id', tenantId)
    .gte('time_in', minuteStart.toISOString())
    .lt('time_in', minuteEnd.toISOString())
    .single();
  if (sameMinuteRecord) {
    return NextResponse.json({ ...sameMinuteRecord, employee: employeeView, message: 'Check-in already exists for this minute' });
  }

  if (resolved.tag) {
    await supabase.from('nfc_tags').update({
      last_used_at: nowDate.toISOString(),
      reader_id: payload.readerId || resolved.tag.reader_id,
    })
    .eq('tag_uid', String(resolved.tag.tag_uid))
    .eq('tenant_id', tenantId);
  }

  // --- RESOLVE POLICY & SHIFT RULES ---
  const policy = await getPolicyForEmployee(supabase, tenantId, resolved.employeeId);
  const shift = await getShiftForEmployee(supabase, tenantId, resolved.employeeId, today);

  const roundedIn = applyRounding(nowDate, policy.rounding_minutes);
  const shiftStart = parseShiftTime(shift.start_time, today);

  // Late Arrival Check
  let isLate = false;
  let status = 'present';
  if (!policy.is_flexible) {
    const lateThreshold = new Date(shiftStart.getTime() + policy.grace_period_late_minutes * 60000);
    if (roundedIn > lateThreshold) {
      isLate = true;
      status = 'late';
    }
  }

  const clientIp = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip');
  const userAgent = request.headers.get('user-agent');

  // --- AI ANOMALY & FRAUD DETECTION ---
  const aiResult = await detectAttendanceAnomaly({
    employeeId: resolved.employeeId,
    date: today,
    timeIn: nowDate.toISOString(),
    locationLatitude: payload.locationLatitude,
    locationLongitude: payload.locationLongitude,
    officeLatitude: policy.target_assignment?.office_latitude ?? null,
    officeLongitude: policy.target_assignment?.office_longitude ?? null,
    geofenceRadiusMeters: policy.target_assignment?.geofence_radius ?? 500,
    allowedIps: policy.target_assignment?.allowed_ips ?? '',
    clientIp,
    userAgent,
    shiftStart: shift.start_time,
    shiftEnd: shift.end_time,
  });

  const violationFlags: any = {};
  if (aiResult.isAnomaly) {
    violationFlags[aiResult.anomalyType] = aiResult.details;
  }

  const targetDateObj = new Date(today);
  const isWeekend = targetDateObj.getDay() === 0 || targetDateObj.getDay() === 6;

  // ROUTE TO APPROVAL QUEUE IF WEEKEND OR ANOMALY DETECTED
  if (isWeekend || aiResult.isAnomaly) {
    const targetTimeIn = payload.timeIn || nowDate.toISOString();
    const targetTimeOut = payload.timeOut || null;

    const { data: requestRecord, error: requestError } = await supabase.from('attendance_requests').insert({
      employee_id: resolved.employeeId,
      date: payload.date || today,
      time_in: targetTimeIn,
      time_out: targetTimeOut,
      duration: null,
      status: 'pending',
      check_in_method: resolved.checkInMethod,
      location: payload.location ?? null,
      reader_id: payload.readerId ?? null,
      notes: payload.metadata?.notes ?? (isWeekend ? 'Weekend Check-in' : `AI Alert: ${aiResult.details}`),
      violation_flags: violationFlags,
      tenant_id: tenantId,
      created_at: nowDate.toISOString(),
      updated_at: nowDate.toISOString(),
      metadata: { 
        ...payload.metadata, 
        aiConfidence: aiResult.confidenceScore, 
        aiDetails: aiResult.details,
        clientIp,
        userAgent,
        requested_time_in: targetTimeIn,
        requested_time_out: targetTimeOut,
        reason_type: payload.metadata?.reasonType || (isWeekend ? 'regularization' : 'dispute'),
        gps_latitude: payload.locationLatitude ?? null,
        gps_longitude: payload.locationLongitude ?? null,
        ai_fraud_check: {
          isAnomaly: aiResult.isAnomaly,
          anomalyType: aiResult.anomalyType,
          confidenceScore: aiResult.confidenceScore,
          details: aiResult.details,
          recommendation: aiResult.recommendation
        }
      }
    }).select('*').single();

    if (requestError || !requestRecord) throw requestError ?? new Error('Failed to create attendance request');

    const requestRecordMapped = {
      ...requestRecord,
      ai_fraud_check: requestRecord.ai_fraud_check ?? requestRecord.metadata?.ai_fraud_check,
      requested_time_in: requestRecord.requested_time_in ?? requestRecord.metadata?.requested_time_in,
      reason_type: requestRecord.reason_type ?? requestRecord.metadata?.reason_type,
      gps_latitude: requestRecord.gps_latitude ?? requestRecord.metadata?.gps_latitude,
      gps_longitude: requestRecord.gps_longitude ?? requestRecord.metadata?.gps_longitude
    };

    // Create Exception Log for Audits
    if (aiResult.isAnomaly) {
      await supabase.from('attendance_exceptions').insert({
        tenant_id: tenantId,
        employee_id: resolved.employeeId,
        date: today,
        exception_type: aiResult.anomalyType,
        severity: aiResult.confidenceScore > 80 ? 'high' : 'medium',
        details: aiResult.details,
        ai_detected: true,
        ai_confidence: aiResult.confidenceScore,
        resolved: false,
        created_at: nowDate.toISOString(),
      });

      await publishDomainEvent(supabase, tenantId, 'AttendanceAnomalyDetected', {
        employeeId: resolved.employeeId,
        date: today,
        anomalyType: aiResult.anomalyType,
        confidenceScore: aiResult.confidenceScore,
        details: aiResult.details
      });
    }

    // Publish Event
    await publishDomainEvent(supabase, tenantId, 'AttendanceRegularized', {
      requestId: requestRecord.id,
      employeeId: resolved.employeeId,
      date: today,
      reasonType: 'regularization'
    });

    // Write Audit Log
    await logAuditAction(supabase, {
      tenantId,
      employeeId: resolved.employeeId,
      actorId: actor.legacyUserId ? String(actor.legacyUserId) : null,
      actionType: 'regularize_request',
      clientIp,
      userAgent,
      gpsCoordinates: payload.locationLatitude ? `${payload.locationLatitude},${payload.locationLongitude}` : null,
      metadata: { isAnomaly: aiResult.isAnomaly, checkInMethod: resolved.checkInMethod }
    });

    return NextResponse.json({ 
      success: true, 
      routedToQueue: true, 
      message: isWeekend ? 'Weekend check-in routed to approval queue.' : `Check-in routed to approval queue: ${aiResult.details}` 
    }, { status: 202 });
  }

  // NORMAL CHECK-IN
  const metadata = {
    ...payload.metadata,
    clientIp,
    userAgent,
    roundedIn: roundedIn.toISOString()
  };

  const { data: created, error } = await supabase.from('attendance_records').insert({
    employee_id: resolved.employeeId,
    date: today,
    time_in: nowDate.toISOString(),
    time_out: null,
    location_latitude: payload.locationLatitude ?? null,
    location_longitude: payload.locationLongitude ?? null,
    duration: null,
    status,
    check_in_method: resolved.checkInMethod,
    reader_id: payload.readerId ?? null,
    location: payload.location ?? null,
    tag_uid: payload.tagUid ?? null,
    idempotency_key: payload.idempotencyKey || crypto.randomUUID(),
    synced_at: null,
    metadata,
    tenant_id: tenantId,
    created_at: nowDate.toISOString(),
  }).select('*').single();

  if (error || !created) throw error ?? new Error('Failed to create attendance record');

  // Trigger Late Arrival Exception if applicable
  if (isLate) {
    await supabase.from('attendance_exceptions').insert({
      tenant_id: tenantId,
      employee_id: resolved.employeeId,
      date: today,
      exception_type: 'late_arrival',
      severity: 'low',
      details: `Checked in late at ${nowDate.toLocaleTimeString()} (Shift start: ${shift.start_time}).`,
      ai_detected: false,
      resolved: false,
      created_at: nowDate.toISOString(),
    });

    await publishDomainEvent(supabase, tenantId, 'AttendancePolicyViolationDetected', {
      employeeId: resolved.employeeId,
      date: today,
      violationType: 'late_arrival'
    });
  }

  // Publish Event
  await publishDomainEvent(supabase, tenantId, 'AttendanceMarked', {
    recordId: created.id,
    employeeId: resolved.employeeId,
    date: today,
    status
  });

  // Write Audit Log
  await logAuditAction(supabase, {
    tenantId,
    employeeId: resolved.employeeId,
    actorId: actor.legacyUserId ? String(actor.legacyUserId) : null,
    actionType: 'check_in',
    recordId: Number(created.id),
    clientIp,
    userAgent,
    gpsCoordinates: payload.locationLatitude ? `${payload.locationLatitude},${payload.locationLongitude}` : null,
    metadata: { checkInMethod: resolved.checkInMethod, status }
  });

  return NextResponse.json({ ...created, employee: employeeView, message: 'Check-in successful' }, { status: 201 });
}, { requireAuth: true, roles: ['Employee'] });

