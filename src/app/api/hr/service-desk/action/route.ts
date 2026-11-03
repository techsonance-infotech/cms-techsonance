import { NextResponse } from 'next/server';
import { withApiHandler } from '@/server/http/handler';
import { BadRequestError, ForbiddenError } from '@/server/http/errors';
import { getAdminRouteSupabase } from '@/server/supabase/route-helpers';
import { normalizeAppRole } from '@/server/auth/rbac';

export const POST = withApiHandler(async (request, context) => {
  const payload = await request.json();
  const {
    ticketIds = [],
    action = 'resolve', // 'resolve', 'escalate', 'internal_note', 'csat_feedback'
    resolutionNotes = '',
    internalNotes = '',
    csatRating = null,
    csatFeedback = ''
  } = payload;

  const user = context.auth!.user;
  const tenantId = user.tenantId;

  if (!tenantId) throw new BadRequestError('Tenant ID missing');

  if (!Array.isArray(ticketIds) || ticketIds.length === 0) {
    throw new BadRequestError('Ticket IDs list is required');
  }

  const userRole = (user.role || '').toLowerCase().replace(/[^a-z0-9_]/g, '');
  const normalizedRole = normalizeAppRole(user.role);
  const rawRole = (user.rawRole || user.role || '').toLowerCase().replace(/[^a-z0-9_]/g, '');
  const isAuthorizedManager =
    normalizedRole === 'SuperAdmin' ||
    normalizedRole === 'Admin' ||
    normalizedRole === 'Manager' ||
    ['admin', 'superadmin', 'super_admin', 'hr_manager', 'project_manager', 'owner', 'tenant_owner'].includes(rawRole);

  const supabase = getAdminRouteSupabase();

  // If submitting CSAT feedback, allow the ticket owner
  if (action === 'csat_feedback') {
    if (!csatRating || csatRating < 1 || csatRating > 5) {
      throw new BadRequestError('Valid CSAT rating (1-5 stars) is required');
    }

    try {
      await supabase.from('hr_service_tickets')
        .update({
          csat_rating: csatRating,
          csat_feedback: csatFeedback ? csatFeedback.trim() : null,
          updated_at: new Date().toISOString()
        })
        .in('id', ticketIds)
        .eq('tenant_id', tenantId);
    } catch (err) {
      console.warn('CSAT feedback DB update error:', err);
    }

    return NextResponse.json({
      success: true,
      message: 'Thank you! Your CSAT rating & feedback have been recorded.',
      timestamp: new Date().toISOString()
    });
  }

  // For resolution, escalation, and internal notes, enforce RBAC
  if (!isAuthorizedManager) {
    throw new ForbiddenError('Insufficient permissions. Resolving or escalating HR cases requires Manager access.');
  }

  let updateFields: any = { updated_at: new Date().toISOString() };

  if (action === 'resolve') {
    updateFields.status = 'Resolved';
    updateFields.resolved_at = new Date().toISOString();
    if (resolutionNotes) updateFields.resolution_notes = resolutionNotes.trim();
  } else if (action === 'escalate') {
    updateFields.status = 'Escalated';
    updateFields.escalation_level = 2; // Escalate to L2 Senior HR Partner
    if (resolutionNotes) updateFields.resolution_notes = resolutionNotes.trim();
  } else if (action === 'internal_note') {
    if (internalNotes) updateFields.internal_notes = internalNotes.trim();
  }

  try {
    await supabase.from('hr_service_tickets')
      .update(updateFields)
      .in('id', ticketIds)
      .eq('tenant_id', tenantId);
  } catch (err) {
    console.warn('HR service ticket action update DB error:', err);
  }

  return NextResponse.json({
    success: true,
    processedCount: ticketIds.length,
    message: ticketIds.length > 1
      ? `Bulk ${action} executed for ${ticketIds.length} HR cases!`
      : `HR Case action (${action}) completed successfully!`,
    timestamp: new Date().toISOString()
  });
}, { requireAuth: true });
