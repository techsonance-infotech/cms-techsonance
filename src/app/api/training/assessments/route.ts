import { NextResponse } from 'next/server';
import { withApiHandler } from '@/server/http/handler';
import { BadRequestError } from '@/server/http/errors';
import { getAdminRouteSupabase } from '@/server/supabase/route-helpers';

export const GET = withApiHandler(async (request, context) => {
  const tenantId = context.auth?.user.tenantId;
  if (!tenantId) throw new BadRequestError('Tenant credentials required');

  const searchParams = new URL(request.url).searchParams;
  const programId = searchParams.get('programId');

  const supabase = getAdminRouteSupabase();
  let query = supabase.from('training_assessments').select('*').eq('tenant_id', tenantId);

  if (programId) {
    query = query.eq('program_id', Number(programId));
  }

  const { data, error } = await query;
  if (error) throw new BadRequestError(error.message);
  return NextResponse.json(data);
}, { requireAuth: true });

export const POST = withApiHandler(async (request, context) => {
  const tenantId = context.auth?.user.tenantId;
  if (!tenantId) throw new BadRequestError('Tenant credentials required');

  const body = await request.json();
  const { programId, title, durationMinutes, passPercentage, questions } = body;

  if (!programId || !title || !questions) {
    throw new BadRequestError('programId, title, and questions are required');
  }

  const supabase = getAdminRouteSupabase();
  const { data, error } = await supabase
    .from('training_assessments')
    .insert({
      tenant_id: tenantId,
      program_id: programId,
      title,
      duration_minutes: durationMinutes || 30,
      pass_percentage: passPercentage || 70,
      questions,
    })
    .select()
    .single();

  if (error) throw new BadRequestError(error.message);
  return NextResponse.json(data);
}, { requireAuth: true });
