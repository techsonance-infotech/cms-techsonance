import { NextResponse } from 'next/server';
import { withApiHandler } from '@/server/http/handler';
import { BadRequestError } from '@/server/http/errors';
import { getAdminRouteSupabase, resolveActorUuid } from '@/server/supabase/route-helpers';

export const GET = withApiHandler(async (request, context) => {
  const tenantId = context.auth?.user.tenantId;
  if (!tenantId) throw new BadRequestError('Tenant context missing');

  const supabase = getAdminRouteSupabase();
  const actorUuid = await resolveActorUuid(context, supabase);

  let { data: interviews, error } = await supabase
    .from('interviews')
    .select('*, job_applications(*, candidate_profiles(*))')
    .eq('tenant_id', tenantId)
    .order('scheduled_at', { ascending: true });

  if (error) throw error;

  // Insert seed interview logs if empty
  if (!interviews || interviews.length === 0) {
    const { data: apps } = await supabase.from('job_applications').select('id').eq('tenant_id', tenantId);

    if (apps && apps.length > 0) {
      const seeds = [
        {
          tenant_id: tenantId,
          application_id: apps[0].id,
          scheduled_at: new Date(Date.now() + 86400000).toISOString(), // Tomorrow
          interview_type: 'Coding',
          status: 'Scheduled',
          interviewer_id: actorUuid
        },
        ...(apps[1] ? [{
          tenant_id: tenantId,
          application_id: apps[1].id,
          scheduled_at: new Date(Date.now() - 172800000).toISOString(), // 2 days ago
          interview_type: 'System Design',
          status: 'Completed',
          feedback_score: 5,
          feedback_notes: 'Priyanka showed exemplary design capabilities. Strongly recommend extending offer.',
          interviewer_id: actorUuid
        }] : [])
      ];

      const { data: inserted, error: insertErr } = await supabase
        .from('interviews')
        .insert(seeds)
        .select('*, job_applications(*, candidate_profiles(*))');

      if (!insertErr && inserted) {
        interviews = inserted;
      }
    }
  }

  return NextResponse.json({ success: true, data: interviews });
}, { requireAuth: true, roles: ['Employee'] });

export const POST = withApiHandler(async (request, context) => {
  const tenantId = context.auth?.user.tenantId;
  if (!tenantId) throw new BadRequestError('Tenant context missing');

  const body = await request.json();
  const { applicationId, scheduledAt, interviewType, status, feedbackScore, feedbackNotes, interviewerId } = body;

  if (!applicationId || !scheduledAt || !interviewType) {
    throw new BadRequestError('Missing applicationId, scheduledAt, or interviewType');
  }

  const supabase = getAdminRouteSupabase();
  const actorUuid = await resolveActorUuid(context, supabase);

  const { data, error } = await supabase
    .from('interviews')
    .insert({
      tenant_id: tenantId,
      application_id: applicationId,
      scheduled_at: scheduledAt,
      interview_type: interviewType,
      status: status || 'Scheduled',
      feedback_score: feedbackScore || 0,
      feedback_notes: feedbackNotes || '',
      interviewer_id: (interviewerId && String(interviewerId).includes('-')) ? interviewerId : actorUuid
    })
    .select('*')
    .single();

  if (error) throw error;
  return NextResponse.json({ success: true, data });
}, { requireAuth: true, roles: ['Employee'] });

export const PUT = withApiHandler(async (request, context) => {
  const tenantId = context.auth?.user.tenantId;
  if (!tenantId) throw new BadRequestError('Tenant context missing');

  const body = await request.json();
  const { interviewId, status, feedbackScore, feedbackNotes } = body;

  if (!interviewId) {
    throw new BadRequestError('Missing interviewId');
  }

  const supabase = getAdminRouteSupabase();

  const updatePayload: Record<string, any> = {};
  if (status) updatePayload.status = status;
  if (feedbackScore !== undefined) updatePayload.feedback_score = Number(feedbackScore);
  if (feedbackNotes !== undefined) updatePayload.feedback_notes = String(feedbackNotes);

  const { data, error } = await supabase
    .from('interviews')
    .update(updatePayload)
    .eq('id', interviewId)
    .eq('tenant_id', tenantId)
    .select('*, job_applications(*, candidate_profiles(*))')
    .single();

  if (error) throw error;
  return NextResponse.json({ success: true, data });
}, { requireAuth: true, roles: ['Employee'] });
