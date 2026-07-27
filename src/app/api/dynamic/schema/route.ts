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
  const history = searchParams.get('history');

  if (history && entitySlug) {
    const { data: schemas, error: schemaError } = await supabase
      .from('custom_form_schemas')
      .select('*')
      .eq('tenant_id', tenantId)
      .eq('entity_slug', entitySlug)
      .order('version', { ascending: false });

    if (schemaError) throw schemaError;
    return NextResponse.json({ success: true, schemas });
  }

  if (entitySlug) {
    // Return active schema format if exists
    const { data: activeSchema, error: activeError } = await supabase
      .from('custom_form_schemas')
      .select('*')
      .eq('tenant_id', tenantId)
      .eq('entity_slug', entitySlug)
      .eq('active', true)
      .maybeSingle();

    if (activeError) throw activeError;

    const { data: fields, error: fieldsError } = await supabase
      .from('custom_fields')
      .select('*')
      .eq('tenant_id', tenantId)
      .eq('entity_slug', entitySlug);

    if (fieldsError) throw fieldsError;
    return NextResponse.json({ success: true, fields, activeSchema });
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

  if (body.type === 'publish-schema') {
    const { entitySlug, schemaJson } = body;
    if (!entitySlug || !schemaJson) throw new BadRequestError('EntitySlug and schemaJson are required');

    // Get current max version
    const { data: versions } = await supabase
      .from('custom_form_schemas')
      .select('version')
      .eq('tenant_id', tenantId)
      .eq('entity_slug', entitySlug)
      .order('version', { ascending: false })
      .limit(1);

    const nextVersion = versions && versions.length > 0 ? (versions[0].version + 1) : 1;

    // Set all previous active schemas to false
    await supabase
      .from('custom_form_schemas')
      .update({ active: false })
      .eq('tenant_id', tenantId)
      .eq('entity_slug', entitySlug);

    const { data, error } = await supabase
      .from('custom_form_schemas')
      .insert({
        tenant_id: tenantId,
        entity_slug: entitySlug,
        version: nextVersion,
        active: true,
        schema_json: schemaJson
      })
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json({ success: true, message: `Schema published as Version ${nextVersion}!`, data });
  }

  if (body.type === 'rollback-schema') {
    const { entitySlug, version } = body;
    if (!entitySlug || !version) throw new BadRequestError('EntitySlug and version are required');

    // Set all schemas to inactive
    await supabase
      .from('custom_form_schemas')
      .update({ active: false })
      .eq('tenant_id', tenantId)
      .eq('entity_slug', entitySlug);

    // Set specific version to active
    const { data, error } = await supabase
      .from('custom_form_schemas')
      .update({ active: true })
      .eq('tenant_id', tenantId)
      .eq('entity_slug', entitySlug)
      .eq('version', version)
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json({ success: true, message: `Rolled back schema to Version ${version}!`, data });
  }

  throw new BadRequestError('Invalid action type.');
}, { requireAuth: true, roles: ['Admin'] });
