import { NextResponse } from 'next/server';
import { withApiHandler } from '@/server/http/handler';
import { BadRequestError } from '@/server/http/errors';
import { getAdminRouteSupabase } from '@/server/supabase/route-helpers';

export const GET = withApiHandler(async (request, context) => {
  const tenantId = context.auth?.user.tenantId;
  if (!tenantId) throw new BadRequestError('Tenant context missing');

  const supabase = getAdminRouteSupabase();

  let { data: applications, error } = await supabase
    .from('job_applications')
    .select('*, job_requisitions(*), candidate_profiles(*)')
    .eq('tenant_id', tenantId);

  if (error) throw error;

  // If no applications, seed them linked to candidate profiles and requisitions
  if (!applications || applications.length === 0) {
    // Let's grab the seeded job requisitions and candidate profiles to link them correctly
    const { data: reqs } = await supabase.from('job_requisitions').select('id').eq('tenant_id', tenantId);
    const { data: cands } = await supabase.from('candidate_profiles').select('id').eq('tenant_id', tenantId);

    if (reqs && reqs.length > 0 && cands && cands.length > 0) {
      const seeds = [
        {
          tenant_id: tenantId,
          job_requisition_id: reqs[0].id,
          candidate_id: cands[0].id,
          current_stage: 'Technical',
          resume_summary: 'Amit is a senior frontend developer specializing in Next.js.',
          match_score: 92,
          notes: 'Candidate performed well on initial phone screening round.'
        },
        {
          tenant_id: tenantId,
          job_requisition_id: reqs[1].id,
          candidate_id: cands[1].id,
          current_stage: 'Offer',
          resume_summary: 'Priyanka is a DevOps lead with core proficiency in Terraform & EKS.',
          match_score: 95,
          notes: 'Team approved SOW compensation levels. Preparing offer letter.'
        },
        {
          tenant_id: tenantId,
          job_requisition_id: reqs[2].id,
          candidate_id: cands[2].id,
          current_stage: 'Applied',
          resume_summary: 'Vijay is a product designer with a solid interactive prototype background.',
          match_score: 79,
          notes: 'Awaiting portfolio review from Head of Product Design.'
        }
      ];

      const { data: inserted, error: insertErr } = await supabase
        .from('job_applications')
        .insert(seeds)
        .select('*, job_requisitions(*), candidate_profiles(*)');

      if (!insertErr && inserted) {
        applications = inserted;
      }
    }
  }

  return NextResponse.json({ success: true, data: applications });
}, { requireAuth: true, roles: ['Employee'] });

export const POST = withApiHandler(async (request, context) => {
  const tenantId = context.auth?.user.tenantId;
  if (!tenantId) throw new BadRequestError('Tenant context missing');

  const body = await request.json();
  const { applicationId, currentStage, notes } = body;

  if (!applicationId || !currentStage) {
    throw new BadRequestError('Missing applicationId or currentStage');
  }

  const supabase = getAdminRouteSupabase();

  // 1. Update application stage
  const { data, error } = await supabase
    .from('job_applications')
    .update({
      current_stage: currentStage,
      notes: notes,
      updated_at: new Date().toISOString()
    })
    .eq('id', applicationId)
    .eq('tenant_id', tenantId)
    .select('*')
    .single();

  if (error) throw error;

  // 2. Sync applicant status in the candidate profile
  if (data && data.candidate_id) {
    let cpStatus = 'Interviewing';
    if (currentStage === 'Applied') cpStatus = 'Applied';
    else if (currentStage === 'Phone Screen') cpStatus = 'Screening';
    else if (currentStage === 'Offer') cpStatus = 'Offered';
    else if (currentStage === 'Preboarding') cpStatus = 'Hired';

    await supabase
      .from('candidate_profiles')
      .update({ status: cpStatus, updated_at: new Date().toISOString() })
      .eq('id', data.candidate_id)
      .eq('tenant_id', tenantId);
  }

  return NextResponse.json({ success: true, data });
}, { requireAuth: true, roles: ['Employee'] });
