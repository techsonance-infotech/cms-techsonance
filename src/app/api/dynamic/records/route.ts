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

  if (!entitySlug) throw new BadRequestError('entitySlug is required');

  const { data: records, error } = await supabase
    .from('custom_entity_records')
    .select('*')
    .eq('tenant_id', tenantId)
    .eq('entity_slug', entitySlug);

  if (error) throw error;
  return NextResponse.json({ success: true, records });
}, { requireAuth: true, roles: ['Employee'] });

export const POST = withApiHandler(async (request, context) => {
  const tenantId = context.auth?.user.tenantId;
  if (!tenantId) throw new BadRequestError('Tenant info required');

  const supabase = getAdminRouteSupabase();
  const { entitySlug, recordData } = await request.json();

  if (!entitySlug || !recordData) {
    throw new BadRequestError('entitySlug and recordData are required');
  }

  // 1. Fetch registered fields for this dynamic entity slug
  const { data: schemaFields, error: schemaError } = await supabase
    .from('custom_fields')
    .select('*')
    .eq('tenant_id', tenantId)
    .eq('entity_slug', entitySlug);

  if (schemaError) throw schemaError;

  // 2. Validate payload against dynamic schema fields
  const validatedPayload: Record<string, any> = {};
  for (const field of schemaFields || []) {
    const value = recordData[field.name];

    // Check required constraint
    if (field.required && (value === undefined || value === null || value === '')) {
      throw new BadRequestError(`Field '${field.name}' is strictly required.`);
    }

    // Type casting and parsing
    if (value !== undefined && value !== null) {
      if (field.type === 'number') {
        const num = Number(value);
        if (isNaN(num)) throw new BadRequestError(`Field '${field.name}' must be a valid number.`);
        validatedPayload[field.name] = num;
      } else if (field.type === 'boolean') {
        validatedPayload[field.name] = Boolean(value);
      } else {
        validatedPayload[field.name] = String(value);
      }
    } else {
      validatedPayload[field.name] = field.default_value || null;
    }
  }

  // 3. Insert into dynamic entity records
  const { data: record, error: insertError } = await supabase
    .from('custom_entity_records')
    .insert({
      tenant_id: tenantId,
      entity_slug: entitySlug,
      data: validatedPayload,
    })
    .select()
    .single();

  if (insertError) throw insertError;
  return NextResponse.json({ success: true, record }, { status: 201 });
}, { requireAuth: true, roles: ['Employee'] });
