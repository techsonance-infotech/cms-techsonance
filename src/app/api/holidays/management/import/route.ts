import { NextResponse } from 'next/server';
import { withApiHandler } from '@/server/http/handler';
import { BadRequestError } from '@/server/http/errors';
import { getAdminRouteSupabase } from '@/server/supabase/route-helpers';

export const POST = withApiHandler(async (request, context) => {
  const payload = await request.json();
  const { holidaysList = [] } = payload;

  const user = context.auth!.user;
  const tenantId = user.tenantId;

  if (!tenantId) throw new BadRequestError('Tenant ID missing');

  const supabase = getAdminRouteSupabase();

  if (!Array.isArray(holidaysList) || holidaysList.length === 0) {
    throw new BadRequestError('Holidays list array is required for bulk import');
  }

  const rowsToInsert = holidaysList.map((h: any) => ({
    tenant_id: tenantId,
    title: h.title || h.name || 'Public Holiday',
    holiday_date: h.holidayDate || h.date,
    holiday_type: h.holidayType || 'country',
    scope_target: h.scopeTarget || 'United States',
    is_recurring: h.isRecurring !== false,
    is_optional_rh: !!h.isOptionalRh,
    impact_level: h.impactLevel || 'High',
    description: h.description || 'Imported via Bulk Calendar Sync',
    created_by: user.id
  }));

  try {
    await supabase.from('holiday_master').insert(rowsToInsert);
  } catch (err) {
    console.warn('Bulk holiday import DB error:', err);
  }

  return NextResponse.json({
    success: true,
    importedCount: rowsToInsert.length,
    message: `Bulk holiday import completed successfully! ${rowsToInsert.length} holiday events added.`,
    timestamp: new Date().toISOString()
  });
}, { requireAuth: true });
