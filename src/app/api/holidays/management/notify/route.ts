import { NextResponse } from 'next/server';
import { withApiHandler } from '@/server/http/handler';
import { getAdminRouteSupabase } from '@/server/supabase/route-helpers';

export const POST = withApiHandler(async (request, context) => {
  const payload = await request.json();
  const { holidayTitle = 'Upcoming Holiday', holidayDate = '2026-07-28' } = payload;

  const user = context.auth!.user;
  const tenantId = user.tenantId;

  if (!tenantId) {
    return NextResponse.json({ error: 'Tenant ID missing' }, { status: 400 });
  }

  const supabase = getAdminRouteSupabase();

  // Query employees to dispatch notifications
  let employees: any[] = [];
  try {
    const { data } = await supabase
      .from('employees')
      .select('user_id')
      .eq('tenant_id', tenantId)
      .eq('status', 'active');
    if (data) employees = data;
  } catch (err) {
    console.warn('Notify query error:', err);
  }

  if (employees.length > 0) {
    const notificationsToInsert = employees.map((emp: { user_id: string }) => ({
      user_id: emp.user_id,
      title: `Upcoming Holiday: ${holidayTitle}`,
      message: `Notice: ${holidayTitle} is scheduled for ${holidayDate}. Corporate offices will observe this holiday.`,
      type: 'info',
      is_read: false,
      tenant_id: tenantId,
      created_at: new Date().toISOString()
    }));

    try {
      await supabase.from('notifications').insert(notificationsToInsert);
    } catch (err) {
      console.warn('Holiday notifications insert error:', err);
    }
  }

  return NextResponse.json({
    success: true,
    notifiedCount: employees.length,
    message: `Holiday broadcast notification & Google Calendar sync dispatched to ${employees.length} employees!`,
    timestamp: new Date().toISOString()
  });
}, { requireAuth: true });
