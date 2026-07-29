import { NextResponse } from 'next/server';
import { withApiHandler } from '@/server/http/handler';
import { BadRequestError, NotFoundError } from '@/server/http/errors';
import { getAdminRouteSupabase } from '@/server/supabase/route-helpers';
import { z } from 'zod';

const psaContractSchema = z.object({
  projectId: z.coerce.number().int().positive(),
  sowDetails: z.string().trim().optional().nullable(),
  billingModel: z.enum(['fixed_cost', 'time_and_materials', 'retainer']).default('fixed_cost'),
  plannedRevenue: z.coerce.number().nonnegative().default(0),
  actualRevenue: z.coerce.number().nonnegative().default(0),
  plannedCost: z.coerce.number().nonnegative().default(0),
  actualCost: z.coerce.number().nonnegative().default(0),
  marginPercentage: z.coerce.number().default(0),
  revenueLeakage: z.coerce.number().nonnegative().default(0),
});

export const GET = withApiHandler(async (request, context) => {
  const accessToken = context.auth?.accessToken;
  const tenantId = context.auth?.user.tenantId;
  if (!accessToken || !tenantId) throw new BadRequestError('Authorization and tenant info required');

  const supabase = getAdminRouteSupabase();
  const { data: contracts, error } = await supabase
    .from('psa_contracts')
    .select('*, project:projects(id, name, budget, status)')
    .eq('tenant_id', tenantId);

  if (error) throw error;

  return NextResponse.json({
    success: true,
    data: contracts || [],
    message: 'PSA Contracts fetched successfully',
  });
}, { requireAuth: true, roles: ['Employee'] });

export const POST = withApiHandler(async (request, context) => {
  const payload = psaContractSchema.parse(await request.json());

  const accessToken = context.auth?.accessToken;
  const tenantId = context.auth?.user.tenantId;
  if (!accessToken || !tenantId) throw new BadRequestError('Authorization and tenant info required');

  const supabase = getAdminRouteSupabase();

  // Validate project existence
  const { data: project } = await supabase
    .from('projects')
    .select('id')
    .eq('id', payload.projectId)
    .eq('tenant_id', tenantId)
    .single();
  if (!project) throw new NotFoundError('Project not found');

  // Upsert pattern: update if contract already exists for this project, otherwise insert
  const { data: existing } = await supabase
    .from('psa_contracts')
    .select('id')
    .eq('project_id', payload.projectId)
    .eq('tenant_id', tenantId)
    .single();

  let query;
  if (existing) {
    query = supabase
      .from('psa_contracts')
      .update({
        sow_details: payload.sowDetails,
        billing_model: payload.billingModel,
        planned_revenue: payload.plannedRevenue,
        actual_revenue: payload.actualRevenue,
        planned_cost: payload.plannedCost,
        actual_cost: payload.actualCost,
        margin_percentage: payload.marginPercentage,
        revenue_leakage: payload.revenueLeakage,
      })
      .eq('id', existing.id)
      .eq('tenant_id', tenantId);
  } else {
    query = supabase
      .from('psa_contracts')
      .insert({
        tenant_id: tenantId,
        project_id: payload.projectId,
        sow_details: payload.sowDetails,
        billing_model: payload.billingModel,
        planned_revenue: payload.plannedRevenue,
        actual_revenue: payload.actualRevenue,
        planned_cost: payload.plannedCost,
        actual_cost: payload.actualCost,
        margin_percentage: payload.marginPercentage,
        revenue_leakage: payload.revenueLeakage,
      });
  }

  const { data, error } = await query.select('*').single();
  if (error) throw error;

  return NextResponse.json({
    success: true,
    data,
    message: 'PSA Contract margins upserted successfully',
  });
}, { requireAuth: true, roles: ['Manager'] });
