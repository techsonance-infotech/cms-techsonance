import { NextResponse } from 'next/server';
import { withApiHandler } from '@/server/http/handler';
import { BadRequestError, NotFoundError } from '@/server/http/errors';
import { getAdminRouteSupabase, getCurrentSupabaseActor } from '@/server/supabase/route-helpers';
import { attendancePolicySchema } from '@/server/validation/attendance-admin';
import { logAuditAction, publishDomainEvent } from '@/server/events/dispatcher';

export const GET = withApiHandler(async (request, context) => {
  const tenantId = context.auth?.user.tenantId;
  if (!tenantId) throw new BadRequestError('Tenant info required');

  const supabase = getAdminRouteSupabase();

  const { data: policies, error } = await supabase
    .from('attendance_policies')
    .select('*')
    .eq('tenant_id', tenantId)
    .order('created_at', { ascending: true });

  if (error) throw error;

  return NextResponse.json(policies);
}, { requireAuth: true, roles: ['Employee', 'Admin', 'Manager'] });

export const POST = withApiHandler(async (request, context) => {
  const payload = attendancePolicySchema.parse(await request.json());
  const tenantId = context.auth?.user.tenantId;
  const accessToken = context.auth?.accessToken;
  if (!tenantId || !accessToken) throw new BadRequestError('Authorization and tenant info required');

  const supabase = getAdminRouteSupabase();
  const actor = await getCurrentSupabaseActor(accessToken);

  // If this policy is set to default, unset is_default on other policies
  if (payload.isDefault) {
    await supabase
      .from('attendance_policies')
      .update({ is_default: false })
      .eq('tenant_id', tenantId);
  }

  const { data: policy, error } = await supabase
    .from('attendance_policies')
    .insert({
      tenant_id: tenantId,
      name: payload.name,
      is_default: payload.isDefault,
      standard_hours: payload.standardHours,
      min_hours_half_day: payload.minHoursHalfDay,
      min_hours_full_day: payload.minHoursFullDay,
      grace_period_late_minutes: payload.gracePeriodLateMinutes,
      grace_period_early_exit_minutes: payload.gracePeriodEarlyExitMinutes,
      is_flexible: payload.isFlexible,
      rounding_minutes: payload.roundingMinutes,
      auto_mark_absence: payload.autoMarkAbsence,
      unpaid_break_duration_minutes: payload.unpaidBreakDurationMinutes,
      paid_break_duration_minutes: payload.paidBreakDurationMinutes,
      overtime_eligibility: payload.overtimeEligibility,
      overtime_min_minutes: payload.overtimeMinMinutes,
      overtime_rate_multiplier: payload.overtimeRateMultiplier,
      weekly_off_days: payload.weeklyOffDays,
      target_assignment: payload.targetAssignment,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .select('*')
    .single();

  if (error || !policy) throw error ?? new Error('Failed to create attendance policy');

  // Log and Event
  await publishDomainEvent(supabase, tenantId, 'AttendanceLocked', {
    policyId: policy.id,
    policyName: policy.name,
    action: 'created'
  });

  const clientIp = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip');
  const userAgent = request.headers.get('user-agent');
  await logAuditAction(supabase, {
    tenantId,
    actorId: actor.legacyUserId ? String(actor.legacyUserId) : null,
    actionType: 'policy_update',
    clientIp,
    userAgent,
    metadata: { policyId: policy.id, policyName: policy.name }
  });

  return NextResponse.json(policy, { status: 201 });
}, { requireAuth: true, roles: ['Admin', 'SuperAdmin', 'Manager'] });

export const PUT = withApiHandler(async (request, context) => {
  const url = new URL(request.url);
  const policyId = url.searchParams.get('id');
  if (!policyId) throw new BadRequestError('Policy ID query parameter is required');

  const payload = attendancePolicySchema.parse(await request.json());
  const tenantId = context.auth?.user.tenantId;
  const accessToken = context.auth?.accessToken;
  if (!tenantId || !accessToken) throw new BadRequestError('Authorization and tenant info required');

  const supabase = getAdminRouteSupabase();
  const actor = await getCurrentSupabaseActor(accessToken);

  // If set to default, unset other defaults
  if (payload.isDefault) {
    await supabase
      .from('attendance_policies')
      .update({ is_default: false })
      .eq('tenant_id', tenantId);
  }

  const { data: updated, error } = await supabase
    .from('attendance_policies')
    .update({
      name: payload.name,
      is_default: payload.isDefault,
      standard_hours: payload.standardHours,
      min_hours_half_day: payload.minHoursHalfDay,
      min_hours_full_day: payload.minHoursFullDay,
      grace_period_late_minutes: payload.gracePeriodLateMinutes,
      grace_period_early_exit_minutes: payload.gracePeriodEarlyExitMinutes,
      is_flexible: payload.isFlexible,
      rounding_minutes: payload.roundingMinutes,
      auto_mark_absence: payload.autoMarkAbsence,
      unpaid_break_duration_minutes: payload.unpaidBreakDurationMinutes,
      paid_break_duration_minutes: payload.paidBreakDurationMinutes,
      overtime_eligibility: payload.overtimeEligibility,
      overtime_min_minutes: payload.overtimeMinMinutes,
      overtime_rate_multiplier: payload.overtimeRateMultiplier,
      weekly_off_days: payload.weeklyOffDays,
      target_assignment: payload.targetAssignment,
      updated_at: new Date().toISOString(),
    })
    .eq('id', policyId)
    .eq('tenant_id', tenantId)
    .select('*')
    .single();

  if (error || !updated) throw error ?? new NotFoundError('Policy not found or update failed');

  // Trigger Log and Event
  await publishDomainEvent(supabase, tenantId, 'AttendanceLocked', {
    policyId: updated.id,
    policyName: updated.name,
    action: 'updated'
  });

  const clientIp = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip');
  const userAgent = request.headers.get('user-agent');
  await logAuditAction(supabase, {
    tenantId,
    actorId: actor.legacyUserId ? String(actor.legacyUserId) : null,
    actionType: 'policy_update',
    clientIp,
    userAgent,
    metadata: { policyId: updated.id, policyName: updated.name }
  });

  return NextResponse.json(updated);
}, { requireAuth: true, roles: ['Admin', 'SuperAdmin', 'Manager'] });

export const DELETE = withApiHandler(async (request, context) => {
  const url = new URL(request.url);
  const policyId = url.searchParams.get('id');
  if (!policyId) throw new BadRequestError('Policy ID query parameter is required');

  const tenantId = context.auth?.user.tenantId;
  const accessToken = context.auth?.accessToken;
  if (!tenantId || !accessToken) throw new BadRequestError('Authorization and tenant info required');

  const supabase = getAdminRouteSupabase();
  const actor = await getCurrentSupabaseActor(accessToken);

  // Check if it's the default policy
  const { data: existing } = await supabase
    .from('attendance_policies')
    .select('*')
    .eq('id', policyId)
    .eq('tenant_id', tenantId)
    .single();

  if (!existing) throw new NotFoundError('Policy not found');
  if (existing.is_default) {
    throw new BadRequestError('Cannot delete the default company attendance policy. Designate another policy as default first.');
  }

  const { error } = await supabase
    .from('attendance_policies')
    .delete()
    .eq('id', policyId)
    .eq('tenant_id', tenantId);

  if (error) throw error;

  // Log and Event
  await publishDomainEvent(supabase, tenantId, 'AttendanceLocked', {
    policyId,
    action: 'deleted'
  });

  const clientIp = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip');
  const userAgent = request.headers.get('user-agent');
  await logAuditAction(supabase, {
    tenantId,
    actorId: actor.legacyUserId ? String(actor.legacyUserId) : null,
    actionType: 'policy_update',
    clientIp,
    userAgent,
    metadata: { policyId, action: 'deleted' }
  });

  return NextResponse.json({ success: true });
}, { requireAuth: true, roles: ['Admin', 'SuperAdmin', 'Manager'] });
