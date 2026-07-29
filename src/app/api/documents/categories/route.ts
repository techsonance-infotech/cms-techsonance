import { NextResponse } from 'next/server';
import { withApiHandler } from '@/server/http/handler';
import { BadRequestError } from '@/server/http/errors';
import { getAdminRouteSupabase } from '@/server/supabase/route-helpers';
import { documentCategorySchema } from '@/server/validation/documents';

export const GET = withApiHandler(async (request, context) => {
  const tenantId = context.auth?.user.tenantId;
  if (!tenantId) throw new BadRequestError('Tenant info required');

  const supabase = getAdminRouteSupabase();
  const { data, error } = await supabase
    .from('document_categories')
    .select('*')
    .eq('tenant_id', tenantId)
    .order('name', { ascending: true });

  if (error) throw new BadRequestError(error.message);
  return NextResponse.json(data);
}, { requireAuth: true });

export const POST = withApiHandler(async (request, context) => {
  const tenantId = context.auth?.user.tenantId;
  if (!tenantId) throw new BadRequestError('Tenant info required');

  const body = await request.json();
  const validated = documentCategorySchema.parse(body);

  const supabase = getAdminRouteSupabase();
  const { data, error } = await supabase
    .from('document_categories')
    .insert({
      tenant_id: tenantId,
      name: validated.name,
      description: validated.description,
      is_required: validated.isRequired,
    })
    .select()
    .single();

  if (error) throw new BadRequestError(error.message);
  return NextResponse.json(data);
}, { requireAuth: true });
