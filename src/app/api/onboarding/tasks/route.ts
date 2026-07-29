import { NextResponse } from 'next/server';
import { withApiHandler } from '@/server/http/handler';
import { BadRequestError } from '@/server/http/errors';
import { getAdminRouteSupabase } from '@/server/supabase/route-helpers';
import { onboardingTaskSchema } from '@/server/validation/onboarding';

export const GET = withApiHandler(async (request, context) => {
  const tenantId = context.auth?.user.tenantId;
  if (!tenantId) throw new BadRequestError('Tenant info required');

  const searchParams = new URL(request.url).searchParams;
  const checklistId = searchParams.get('checklistId');
  if (!checklistId) throw new BadRequestError('checklistId is required');

  const supabase = getAdminRouteSupabase();
  const { data, error } = await supabase
    .from('onboarding_tasks')
    .select('*')
    .eq('tenant_id', tenantId)
    .eq('checklist_id', Number(checklistId))
    .order('created_at', { ascending: true });

  if (error) throw new BadRequestError(error.message);
  return NextResponse.json(data);
}, { requireAuth: true });

export const POST = withApiHandler(async (request, context) => {
  const tenantId = context.auth?.user.tenantId;
  if (!tenantId) throw new BadRequestError('Tenant info required');

  const body = await request.json();
  const validated = onboardingTaskSchema.parse(body);

  const supabase = getAdminRouteSupabase();
  const { data, error } = await supabase
    .from('onboarding_tasks')
    .insert({
      tenant_id: tenantId,
      checklist_id: validated.checklistId,
      title: validated.title,
      description: validated.description,
      role_responsible: validated.roleResponsible,
      days_to_complete: validated.daysToComplete,
    })
    .select()
    .single();

  if (error) throw new BadRequestError(error.message);
  return NextResponse.json(data);
}, { requireAuth: true });
