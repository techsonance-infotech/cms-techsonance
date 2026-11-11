import { NextResponse } from 'next/server';
import { withApiHandler } from '@/server/http/handler';
import { BadRequestError } from '@/server/http/errors';
import { getAdminRouteSupabase, resolveTenantId } from '@/server/supabase/route-helpers';
import { trainingProgramSchema } from '@/server/validation/training';

export const GET = withApiHandler(async (request, context) => {
  const supabase = getAdminRouteSupabase();
  const tenantId = await resolveTenantId(context, supabase);
  if (!tenantId) throw new BadRequestError('Tenant info required');

  const { data, error } = await supabase
    .from('training_programs')
    .select('*')
    .eq('tenant_id', tenantId)
    .order('created_at', { ascending: false });

  if (error) throw new BadRequestError(error.message);
  return NextResponse.json(data);
}, { requireAuth: true });

export const POST = withApiHandler(async (request, context) => {
  const supabase = getAdminRouteSupabase();
  const tenantId = await resolveTenantId(context, supabase);
  if (!tenantId) throw new BadRequestError('Tenant info required');

  const body = await request.json();
  const validated = trainingProgramSchema.parse(body);

  const { data, error } = await supabase
    .from('training_programs')
    .insert({
      tenant_id: tenantId,
      title: validated.title,
      description: validated.description,
      instructor: validated.instructor,
      duration_hours: validated.durationHours,
      code: validated.code || null,
      category: validated.category || 'Technical',
      subcategory: validated.subcategory || null,
      difficulty_level: validated.difficultyLevel || 'Intermediate',
      target_audience: validated.targetAudience || null,
      delivery_method: validated.deliveryMethod || 'Self-Paced',
      validity_period: validated.validityPeriod || 365,
      ce_credits: validated.ceCredits || 0,
      cost_centre: validated.costCentre || null,
      pricing: validated.pricing || 0,
      passing_criteria: validated.passingCriteria || 70,
    })
    .select()
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
    .from('training_programs')
    .delete()
    .eq('id', Number(id))
    .eq('tenant_id', tenantId);

  if (error) throw new BadRequestError(error.message);
  return NextResponse.json({ success: true });
}, { requireAuth: true });
