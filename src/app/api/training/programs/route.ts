import { NextResponse } from 'next/server';
import { withApiHandler } from '@/server/http/handler';
import { BadRequestError } from '@/server/http/errors';
import { getAdminRouteSupabase } from '@/server/supabase/route-helpers';
import { trainingProgramSchema } from '@/server/validation/training';

export const GET = withApiHandler(async (request, context) => {
  const user = context.auth?.user;
  const supabase = getAdminRouteSupabase();
  let tenantId = user?.tenantId;

  if (!tenantId && user) {
    const userIdentifier = user.providerUserId || user.id;
    if (userIdentifier) {
      const { data: u } = await supabase
        .from('users')
        .select('tenant_id')
        .or(`id.eq.${userIdentifier},legacy_user_id.eq.${typeof userIdentifier === 'number' ? userIdentifier : 0}`)
        .maybeSingle();
      tenantId = u?.tenant_id;
    }
  }

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
  const tenantId = context.auth?.user.tenantId;
  if (!tenantId) throw new BadRequestError('Tenant info required');

  const body = await request.json();
  const validated = trainingProgramSchema.parse(body);

  const supabase = getAdminRouteSupabase();
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
