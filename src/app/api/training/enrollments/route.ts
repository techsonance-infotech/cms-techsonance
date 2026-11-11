import { NextResponse } from 'next/server';
import { withApiHandler } from '@/server/http/handler';
import { BadRequestError } from '@/server/http/errors';
import { getAdminRouteSupabase, resolveTenantId } from '@/server/supabase/route-helpers';
import { trainingEnrollmentSchema } from '@/server/validation/training';

export const GET = withApiHandler(async (request, context) => {
  const supabase = getAdminRouteSupabase();
  const tenantId = await resolveTenantId(context, supabase);
  if (!tenantId) throw new BadRequestError('Tenant info required');

  const searchParams = new URL(request.url).searchParams;
  const employeeId = searchParams.get('employeeId');

  let query = supabase
    .from('training_enrollments')
    .select('*, training_programs(*)')
    .eq('tenant_id', tenantId);

  if (employeeId) {
    query = query.eq('employee_id', Number(employeeId));
  }

  const { data, error } = await query.order('created_at', { ascending: false });

  if (error) throw new BadRequestError(error.message);
  return NextResponse.json(data);
}, { requireAuth: true });

export const POST = withApiHandler(async (request, context) => {
  const supabase = getAdminRouteSupabase();
  const tenantId = await resolveTenantId(context, supabase);
  if (!tenantId) throw new BadRequestError('Tenant info required');

  const body = await request.json();
  const validated = trainingEnrollmentSchema.parse(body);

  const { data, error } = await supabase
    .from('training_enrollments')
    .insert({
      tenant_id: tenantId,
      program_id: validated.programId,
      employee_id: validated.employeeId,
      status: validated.status || 'enrolled',
      progress_percentage: validated.progressPercentage ?? 0,
      session_id: validated.sessionId || null,
      nominated_by: validated.nominatedBy || null,
      enrolment_type: validated.enrolmentType || 'self',
      assessment_score: validated.assessmentScore || null,
      certificate_url: validated.certificateUrl || null,
      expiry_date: validated.expiryDate || null,
    })
    .select('*, training_programs(*)')
    .single();

  if (error) throw new BadRequestError(error.message);
  return NextResponse.json(data);
}, { requireAuth: true });

export const PUT = withApiHandler(async (request, context) => {
  const supabase = getAdminRouteSupabase();
  const tenantId = await resolveTenantId(context, supabase);
  if (!tenantId) throw new BadRequestError('Tenant info required');

  const body = await request.json();
  const { id, status, progressPercentage, assessmentScore, certificateUrl, expiryDate } = body;
  if (!id) throw new BadRequestError('id is required');

  const updatePayload: Record<string, any> = {
    updated_at: new Date().toISOString()
  };
  if (status !== undefined) updatePayload.status = status;
  if (progressPercentage !== undefined) updatePayload.progress_percentage = progressPercentage;
  if (status === 'completed') updatePayload.completed_at = new Date().toISOString();
  if (assessmentScore !== undefined) updatePayload.assessment_score = assessmentScore;
  if (certificateUrl !== undefined) updatePayload.certificate_url = certificateUrl;
  if (expiryDate !== undefined) updatePayload.expiry_date = expiryDate;

  const { data, error } = await supabase
    .from('training_enrollments')
    .update(updatePayload)
    .eq('id', Number(id))
    .eq('tenant_id', tenantId)
    .select('*, training_programs(*)')
    .single();

  if (error) throw new BadRequestError(error.message);
  return NextResponse.json(data);
}, { requireAuth: true });

export const DELETE = withApiHandler(async (request, context) => {
  const supabase = getAdminRouteSupabase();
  const tenantId = await resolveTenantId(context, supabase);
  if (!tenantId) throw new BadRequestError('Tenant info required');

  const searchParams = new URL(request.url).searchParams;
  const id = searchParams.get('id');
  if (!id) throw new BadRequestError('id is required');

  const { error } = await supabase
    .from('training_enrollments')
    .delete()
    .eq('id', Number(id))
    .eq('tenant_id', tenantId);

  if (error) throw new BadRequestError(error.message);
  return NextResponse.json({ success: true });
}, { requireAuth: true });
