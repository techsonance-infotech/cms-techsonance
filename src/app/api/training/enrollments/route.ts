import { NextResponse } from 'next/server';
import { withApiHandler } from '@/server/http/handler';
import { BadRequestError } from '@/server/http/errors';
import { getAdminRouteSupabase } from '@/server/supabase/route-helpers';
import { trainingEnrollmentSchema } from '@/server/validation/training';

export const GET = withApiHandler(async (request, context) => {
  const tenantId = context.auth?.user.tenantId;
  if (!tenantId) throw new BadRequestError('Tenant info required');

  const searchParams = new URL(request.url).searchParams;
  const employeeId = searchParams.get('employeeId');

  const supabase = getAdminRouteSupabase();
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
  const tenantId = context.auth?.user.tenantId;
  if (!tenantId) throw new BadRequestError('Tenant info required');

  const body = await request.json();
  const validated = trainingEnrollmentSchema.parse(body);

  const supabase = getAdminRouteSupabase();
  const { data, error } = await supabase
    .from('training_enrollments')
    .insert({
      tenant_id: tenantId,
      program_id: validated.programId,
      employee_id: validated.employeeId,
      status: validated.status,
      progress_percentage: validated.progressPercentage,
      session_id: validated.sessionId || null,
      nominated_by: validated.nominatedBy || null,
      enrolment_type: validated.enrolmentType || 'self',
      assessment_score: validated.assessmentScore || null,
      certificate_url: validated.certificateUrl || null,
      expiry_date: validated.expiryDate || null,
    })
    .select()
    .single();

  if (error) throw new BadRequestError(error.message);
  return NextResponse.json(data);
}, { requireAuth: true });

export const PUT = withApiHandler(async (request, context) => {
  const tenantId = context.auth?.user.tenantId;
  if (!tenantId) throw new BadRequestError('Tenant info required');

  const body = await request.json();
  const { id, status, progressPercentage, assessmentScore, certificateUrl, expiryDate } = body;
  if (!id) throw new BadRequestError('id is required');

  const supabase = getAdminRouteSupabase();
  const { data, error } = await supabase
    .from('training_enrollments')
    .update({
      status,
      progress_percentage: progressPercentage,
      completed_at: status === 'completed' ? new Date().toISOString() : null,
      assessment_score: assessmentScore || null,
      certificate_url: certificateUrl || null,
      expiry_date: expiryDate || null,
    })
    .eq('id', Number(id))
    .eq('tenant_id', tenantId)
    .select()
    .single();

  if (error) throw new BadRequestError(error.message);
  return NextResponse.json(data);
}, { requireAuth: true });
