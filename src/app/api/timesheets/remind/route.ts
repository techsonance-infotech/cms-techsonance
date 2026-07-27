import { NextResponse } from 'next/server';
import { withApiHandler } from '@/server/http/handler';
import { getAdminRouteSupabase } from '@/server/supabase/route-helpers';

export const POST = withApiHandler(async (request, context) => {
  const user = context.auth!.user;
  const tenantId = user.tenantId;

  if (!tenantId) {
    return NextResponse.json({ error: 'Tenant ID missing' }, { status: 400 });
  }

  const supabase = getAdminRouteSupabase();

  // Query employees to send ping reminders
  let employees: any[] = [];
  try {
    const { data } = await supabase
      .from('employees')
      .select('user_id, first_name, last_name')
      .eq('tenant_id', tenantId)
      .eq('status', 'active');
    if (data) employees = data;
  } catch (err) {
    console.warn('Remind query error:', err);
  }

  if (employees.length > 0) {
    const notificationsToInsert = employees.map((emp: { user_id: string }) => ({
      user_id: emp.user_id,
      title: '⏰ Timesheet Submission Reminder',
      message: 'Friendly Reminder: Please log and submit your timesheet entries before the pay cycle cutoff.',
      type: 'warning',
      is_read: false,
      tenant_id: tenantId,
      created_at: new Date().toISOString()
    }));

    try {
      await supabase.from('notifications').insert(notificationsToInsert);
    } catch (err) {
      console.warn('Reminder notifications insert error:', err);
    }
  }

  return NextResponse.json({
    success: true,
    remindedCount: employees.length,
    message: `Automated timesheet ping reminders dispatched to ${employees.length} employees!`,
    timestamp: new Date().toISOString()
  });
}, { requireAuth: true });
