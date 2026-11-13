import { NextResponse } from 'next/server';
import { withApiHandler } from '@/server/http/handler';
import { BadRequestError, NotFoundError } from '@/server/http/errors';
import { getAdminRouteSupabase, getCurrentSupabaseActor, resolveTenantId } from '@/server/supabase/route-helpers';
import { attendancePolicySchema } from '@/server/validation/attendance-admin';
import { logAuditAction, publishDomainEvent } from '@/server/events/dispatcher';

export const GET = withApiHandler(async (request, context) => {
  const supabase = getAdminRouteSupabase();
  const tenantId = await resolveTenantId(context, supabase);
  if (!tenantId) throw new BadRequestError('Tenant info required');

  let { data: policies, error } = await supabase
    .from('attendance_policies')
    .select('*')
    .eq('tenant_id', tenantId)
    .order('created_at', { ascending: true });

  if (error) throw error;

  // If no policies exist in DB for this tenant, auto-seed default baseline corporate policy
  if (!policies || policies.length === 0) {
    const defaultPolicy = {
      tenant_id: tenantId,
      name: 'Standard Corporate Attendance Policy',
      is_default: true,
      standard_hours: 9.0,
      min_hours_half_day: 4.0,
      min_hours_full_day: 8.0,
      grace_period_late_minutes: 15,
      grace_period_early_exit_minutes: 15,
      is_flexible: false,
      rounding_minutes: 0,
      auto_mark_absence: true,
      unpaid_break_duration_minutes: 60,
      paid_break_duration_minutes: 0,
      overtime_eligibility: true,
      overtime_min_minutes: 30,
      overtime_rate_multiplier: 1.5,
      weekly_off_days: 'Saturday,Sunday',
      target_assignment: {
        branches: 'All Branches',
        departments: 'All Departments',
        allowedDevices: ['web', 'mobile'],
        punchPairing: 'first_last',
        autoClockoutHours: '12',
        duplicateBufferSeconds: '60',
        maxLateWarnings: '3',
        versions: [{
          version: 1,
          effectiveDate: new Date().toISOString().split('T')[0],
          changeSummary: 'Default corporate baseline policy'
        }]
      }
    };
    const { data: created, error: insertError } = await supabase
      .from('attendance_policies')
      .insert(defaultPolicy)
      .select('*');
    if (!insertError && created) {
      policies = created;
    }
  }

  return NextResponse.json(policies || []);
}, { requireAuth: true, roles: ['Employee', 'Admin', 'Manager'] });

export const POST = withApiHandler(async (request, context) => {
  const payload = attendancePolicySchema.parse(await request.json());
  const supabase = getAdminRouteSupabase();
  const tenantId = await resolveTenantId(context, supabase);
  const accessToken = context.auth?.accessToken;
  if (!tenantId) throw new BadRequestError('Tenant info required');

  let actorLegacyId = context.auth?.user?.id ? String(context.auth.user.id) : null;
  if (accessToken) {
    try {
      const actor = await getCurrentSupabaseActor(accessToken);
      if (actor?.legacyUserId) actorLegacyId = String(actor.legacyUserId);
    } catch {
      // Safe fallback
    }
  }

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
  try {
    await publishDomainEvent(supabase, tenantId, 'AttendanceLocked', {
      policyId: policy.id,
      policyName: policy.name,
      action: 'created'
    });

    const clientIp = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip');
    const userAgent = request.headers.get('user-agent');
    await logAuditAction(supabase, {
      tenantId,
      actorId: actorLegacyId,
      actionType: 'policy_update',
      clientIp,
      userAgent,
      metadata: { policyId: policy.id, policyName: policy.name }
    });
  } catch (auditErr) {
    console.warn('Audit logging note:', auditErr);
  }

  return NextResponse.json(policy, { status: 201 });
}, { requireAuth: true, roles: ['Admin', 'SuperAdmin', 'Manager'] });

export const PUT = withApiHandler(async (request, context) => {
  const url = new URL(request.url);
  const policyId = url.searchParams.get('id');
  if (!policyId) throw new BadRequestError('Policy ID query parameter is required');

  const payload = attendancePolicySchema.parse(await request.json());
  const supabase = getAdminRouteSupabase();
  const tenantId = await resolveTenantId(context, supabase);
  const accessToken = context.auth?.accessToken;
  if (!tenantId) throw new BadRequestError('Tenant info required');

  let actorLegacyId = context.auth?.user?.id ? String(context.auth.user.id) : null;
  if (accessToken) {
    try {
      const actor = await getCurrentSupabaseActor(accessToken);
      if (actor?.legacyUserId) actorLegacyId = String(actor.legacyUserId);
    } catch {
      // Safe fallback
    }
  }

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
  try {
    await publishDomainEvent(supabase, tenantId, 'AttendanceLocked', {
      policyId: updated.id,
      policyName: updated.name,
      action: 'updated'
    });

    const clientIp = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip');
    const userAgent = request.headers.get('user-agent');
    await logAuditAction(supabase, {
      tenantId,
      actorId: actorLegacyId,
      actionType: 'policy_update',
      clientIp,
      userAgent,
      metadata: { policyId: updated.id, policyName: updated.name }
    });
  } catch (auditErr) {
    console.warn('Audit logging note:', auditErr);
  }

  return NextResponse.json(updated);
}, { requireAuth: true, roles: ['Admin', 'SuperAdmin', 'Manager'] });

export const DELETE = withApiHandler(async (request, context) => {
  const url = new URL(request.url);
  const policyId = url.searchParams.get('id');
  if (!policyId) throw new BadRequestError('Policy ID query parameter is required');

  const supabase = getAdminRouteSupabase();
  const tenantId = await resolveTenantId(context, supabase);
  const accessToken = context.auth?.accessToken;
  if (!tenantId) throw new BadRequestError('Tenant info required');

  let actorLegacyId = context.auth?.user?.id ? String(context.auth.user.id) : null;
  if (accessToken) {
    try {
      const actor = await getCurrentSupabaseActor(accessToken);
      if (actor?.legacyUserId) actorLegacyId = String(actor.legacyUserId);
    } catch {
      // Safe fallback
    }
  }

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
  try {
    await publishDomainEvent(supabase, tenantId, 'AttendanceLocked', {
      policyId,
      action: 'deleted'
    });

    const clientIp = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip');
    const userAgent = request.headers.get('user-agent');
    await logAuditAction(supabase, {
      tenantId,
      actorId: actorLegacyId,
      actionType: 'policy_update',
      clientIp,
      userAgent,
      metadata: { policyId, action: 'deleted' }
    });
  } catch (auditErr) {
    console.warn('Audit logging note:', auditErr);
  }

  return NextResponse.json({ success: true });
}, { requireAuth: true, roles: ['Admin', 'SuperAdmin', 'Manager'] });
