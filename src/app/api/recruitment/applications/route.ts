import { NextResponse } from 'next/server';
import { withApiHandler } from '@/server/http/handler';
import { BadRequestError } from '@/server/http/errors';
import { getAdminRouteSupabase, resolveActorUuid } from '@/server/supabase/route-helpers';

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
    const { data: reqs } = await supabase.from('job_requisitions').select('id').eq('tenant_id', tenantId);
    const { data: cands } = await supabase.from('candidate_profiles').select('id').eq('tenant_id', tenantId);

    if (reqs && reqs.length > 0 && cands && cands.length > 0) {
      const candidateMetaList = [
        { stage: 'Technical', summary: 'Amit is a senior frontend developer specializing in Next.js.', score: 92, notes: 'Candidate performed well on initial phone screening round.' },
        { stage: 'Offer', summary: 'Priyanka is a DevOps lead with core proficiency in Terraform & EKS.', score: 95, notes: 'Team approved SOW compensation levels. Preparing offer letter.' },
        { stage: 'Applied', summary: 'Vijay is a product designer with a solid interactive prototype background.', score: 79, notes: 'Awaiting portfolio review from Head of Product Design.' }
      ];

      const seeds = (cands as Array<{ id: string }>).map((cand: { id: string }, idx: number) => {
        const req = (reqs as Array<{ id: string }>)[idx % reqs.length];
        const meta = candidateMetaList[idx] || candidateMetaList[0];
        return {
          tenant_id: tenantId,
          job_requisition_id: req.id,
          candidate_id: cand.id,
          current_stage: meta.stage,
          resume_summary: meta.summary,
          match_score: meta.score,
          notes: meta.notes
        };
      });

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
  const { applicationId, jobRequisitionId, candidateId, currentStage, notes, resumeSummary, matchScore } = body;

  const supabase = getAdminRouteSupabase();

  // Mode 1: Create a brand new application
  if (jobRequisitionId && candidateId) {
    const { data: createdApp, error: createError } = await supabase
      .from('job_applications')
      .upsert({
        tenant_id: tenantId,
        job_requisition_id: jobRequisitionId,
        candidate_id: candidateId,
        current_stage: currentStage || 'Applied',
        notes: notes || null,
        resume_summary: resumeSummary || 'Candidate applied via recruitment system.',
        match_score: matchScore || 85,
        updated_at: new Date().toISOString()
      }, { onConflict: 'tenant_id,job_requisition_id,candidate_id' })
      .select('*, job_requisitions(*), candidate_profiles(*)')
      .single();

    if (createError) throw createError;

    // If created directly in Offer stage, auto-create offer record
    if ((currentStage === 'Offer' || createdApp.current_stage === 'Offer') && createdApp?.id) {
      const creatorUuid = await resolveActorUuid(context, supabase);
      const baseSalary = createdApp.job_requisitions?.salary_range_max || createdApp.job_requisitions?.salary_range_min || 1600000.00;
      const joiningDate = new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0];

      await supabase
        .from('recruitment_offers')
        .insert({
          tenant_id: tenantId,
          application_id: createdApp.id,
          base_salary: baseSalary,
          joining_date: joiningDate,
          status: 'Pending Approval',
          approval_chain: [
            { approver: 'HR Manager', status: 'Approved' },
            { approver: 'VP of Engineering', status: 'Pending' }
          ],
          created_by: creatorUuid
        });
    }

    return NextResponse.json({ success: true, data: createdApp, message: 'Application created successfully' });
  }

  // Mode 2: Update existing application stage
  if (!applicationId || !currentStage) {
    throw new BadRequestError('Missing applicationId or currentStage');
  }

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
    .select('*, job_requisitions(*)')
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

  // 3. Auto-create offer record if candidate is moved to 'Offer' stage and has no offer yet
  if (currentStage === 'Offer' && data?.id) {
    const { data: existingOffer } = await supabase
      .from('recruitment_offers')
      .select('id')
      .eq('application_id', data.id)
      .eq('tenant_id', tenantId)
      .maybeSingle();

    if (!existingOffer) {
      const creatorUuid = await resolveActorUuid(context, supabase);
      const baseSalary = data.job_requisitions?.salary_range_max || data.job_requisitions?.salary_range_min || 1600000.00;
      const joiningDate = new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0];

      await supabase
        .from('recruitment_offers')
        .insert({
          tenant_id: tenantId,
          application_id: data.id,
          base_salary: baseSalary,
          joining_date: joiningDate,
          status: 'Pending Approval',
          approval_chain: [
            { approver: 'HR Manager', status: 'Approved' },
            { approver: 'VP of Engineering', status: 'Pending' }
          ],
          created_by: creatorUuid
        });
    }
  }

  return NextResponse.json({ success: true, data });
}, { requireAuth: true, roles: ['Employee'] });
