import { NextResponse } from 'next/server';
import { withApiHandler } from '@/server/http/handler';
import { getAdminRouteSupabase } from '@/server/supabase/route-helpers';
import { BadRequestError } from '@/server/http/errors';

export const GET = withApiHandler(async (request, context) => {
  const tenantId = context.auth?.user.tenantId;
  if (!tenantId) throw new BadRequestError('Tenant info required');

  const supabase = getAdminRouteSupabase();
  const searchParams = new URL(request.url).searchParams;
  const entitySlug = searchParams.get('entitySlug');

  if (entitySlug) {
    const { data: fields, error: fieldsError } = await supabase
      .from('custom_fields')
      .select('*')
      .eq('tenant_id', tenantId)
      .eq('entity_slug', entitySlug);

    if (fieldsError) throw fieldsError;
    return NextResponse.json({ success: true, fields });
  }

  const { data: entities, error: entitiesError } = await supabase
    .from('custom_entities')
    .select('*')
    .eq('tenant_id', tenantId);

  if (entitiesError) throw entitiesError;
  return NextResponse.json({ success: true, entities });
}, { requireAuth: true, roles: ['Admin', 'Manager'] });

export const POST = withApiHandler(async (request, context) => {
  const tenantId = context.auth?.user.tenantId;
  if (!tenantId) throw new BadRequestError('Tenant info required');

  const supabase = getAdminRouteSupabase();
  const body = await request.json();

  if (body.type === 'entity') {
    const { name, slug, description } = body;
    if (!name || !slug) throw new BadRequestError('Name and slug are required');

    const { data, error } = await supabase
      .from('custom_entities')
      .insert({
        tenant_id: tenantId,
        name,
        slug,
        description,
      })
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json({ success: true, data }, { status: 201 });
  }

  if (body.type === 'field') {
    const { entitySlug, name, fieldType, required, defaultValue } = body;
    if (!entitySlug || !name || !fieldType) throw new BadRequestError('EntitySlug, name, and fieldType are required');

    const { data, error } = await supabase
      .from('custom_fields')
      .insert({
        tenant_id: tenantId,
        entity_slug: entitySlug,
        name,
        type: fieldType,
        required: !!required,
        default_value: defaultValue || null,
      })
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json({ success: true, data }, { status: 201 });
  }

  throw new BadRequestError('Invalid registry type. Must be entity or field');
}, { requireAuth: true, roles: ['Admin'] });
