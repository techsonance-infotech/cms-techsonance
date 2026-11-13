import { NextResponse } from 'next/server';
import { withApiHandler } from '@/server/http/handler';
import { BadRequestError, ForbiddenError } from '@/server/http/errors';
import { getAdminRouteSupabase } from '@/server/supabase/route-helpers';
import { logger } from '@/server/logging/logger';

// Helper to validate UUID string
const isValidUuid = (val: unknown): val is string =>
  typeof val === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(val);

export const POST = withApiHandler(async (request, context) => {
  const payload = await request.json();
  const { holidaysList = [] } = payload;

  const user = context.auth!.user;
  const role = (user.role || '').toLowerCase();
  const isAdminOrManager = ['admin', 'super_admin', 'owner', 'ceo', 'cto', 'business_owner', 'hr_manager'].includes(role);
  if (!isAdminOrManager) {
    throw new ForbiddenError('Access Denied: Only administrators and HR managers can import holiday calendars');
  }
  const tenantId = user.tenantId;

  if (!tenantId) throw new BadRequestError('Tenant ID missing');

  const supabase = getAdminRouteSupabase();

  if (!Array.isArray(holidaysList) || holidaysList.length === 0) {
    throw new BadRequestError('Holidays list array is required for bulk import');
  }

  // Resolve valid UUID for created_by
  const createdByUuid = isValidUuid(user.providerUserId)
    ? user.providerUserId
    : (isValidUuid(context.auth?.tokenId)
      ? context.auth.tokenId
      : (isValidUuid(context.auth?.sessionId) ? context.auth.sessionId : null));

  const rowsToInsert = holidaysList.map((h: any) => ({
    tenant_id: tenantId,
    title: (h.title || h.name || 'Public Holiday').trim(),
    holiday_date: h.holidayDate || h.date,
    holiday_type: h.holidayType || 'country',
    scope_target: h.scopeTarget || 'United States',
    is_recurring: h.isRecurring !== false,
    is_optional_rh: !!h.isOptionalRh,
    impact_level: h.impactLevel || 'High',
    description: h.description || 'Imported via Bulk Calendar Sync',
    created_by: createdByUuid
  }));

  const { error: insErr } = await supabase.from('holiday_master').insert(rowsToInsert);
  if (insErr) {
    logger.error('Bulk holiday import DB error', { error: insErr });
    throw new BadRequestError(insErr.message || 'Bulk holiday import failed');
  }

  // Also sync to company_holidays
  try {
    const { data: maxRecord } = await supabase
      .from('company_holidays')
      .select('id')
      .order('id', { ascending: false })
      .limit(1)
      .maybeSingle();
    let nextId = (maxRecord?.id || 0) + 1;

    for (const h of rowsToInsert) {
      const holidayYear = parseInt(h.holiday_date.split('-')[0], 10) || new Date().getFullYear();
      const { data: existing } = await supabase
        .from('company_holidays')
        .select('id')
        .eq('tenant_id', tenantId)
        .eq('date', h.holiday_date)
        .maybeSingle();

      if (!existing) {
        await supabase.from('company_holidays').insert({
          id: nextId++,
          tenant_id: tenantId,
          date: h.holiday_date,
          reason: h.title,
          year: holidayYear,
          created_at: new Date().toISOString()
        });
      }
    }
  } catch (syncErr) {
    console.warn('Company holiday bulk sync notice:', syncErr);
  }

  return NextResponse.json({
    success: true,
    importedCount: rowsToInsert.length,
    message: `Bulk holiday import completed successfully! ${rowsToInsert.length} holiday events added.`,
    timestamp: new Date().toISOString()
  });
}, { requireAuth: true });
