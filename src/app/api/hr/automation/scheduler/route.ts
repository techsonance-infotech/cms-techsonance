import { NextResponse } from 'next/server';
import { getAdminRouteSupabase } from '@/server/supabase/route-helpers';
import { evaluateHrAutomationTrigger } from '@/server/hr-automation/evaluator';

/**
 * Automated Background Cron Scheduler for HR Automation Engine
 * -------------------------------------------------------------
 * Can be triggered automatically by:
 * 1. Vercel Cron Jobs (vercel.json)
 * 2. Supabase pg_cron extension
 * 3. External HTTP Webhook (GitHub Actions, AWS EventBridge, etc.)
 */
export async function GET(request: Request) {
  return handleCronSchedule(request);
}

export async function POST(request: Request) {
  return handleCronSchedule(request);
}

async function handleCronSchedule(request: Request) {
  const { searchParams } = new URL(request.url);
  const authHeader = request.headers.get('Authorization');
  const cronSecret = process.env.CRON_SECRET || 'hr_automation_cron_secret';

  // Verify Cron Secret authorization if set
  if (process.env.NODE_ENV === 'production' && authHeader !== `Bearer ${cronSecret}` && searchParams.get('secret') !== cronSecret) {
    return NextResponse.json({ error: 'Unauthorized cron request' }, { status: 401 });
  }

  const supabase = getAdminRouteSupabase();
  const executedRules: string[] = [];
  const totalNotificationsDispatched: number[] = [];

  try {
    // Fetch enabled automation rules from database
    const { data: enabledRules, error: rulesErr } = await supabase
      .from('hr_automation_rules')
      .select('*')
      .eq('is_enabled', true);

    if (rulesErr) throw rulesErr;

    const rulesToRun = enabledRules || [];

    for (const rule of rulesToRun) {
      const category = rule.category;
      const tenantId = rule.tenant_id;

      // Evaluate real database logic and filter target recipients
      const evaluation = await evaluateHrAutomationTrigger(tenantId, category, 'cron-system-id');
      const { title, body, recipients, filterReason } = evaluation;

      // Dispatch notifications into notifications table
      const notifs = recipients.map(r => ({
        tenant_id: tenantId,
        user_id: r.userId,
        title,
        message: body,
        type: 'info',
        is_read: false,
        created_at: new Date().toISOString()
      }));
      await supabase.from('notifications').insert(notifs);

      // Log automated dispatch
      await supabase.from('hr_automation_logs').insert({
        tenant_id: tenantId,
        rule_category: category,
        recipient_user_id: recipients[0].userId,
        recipient_name: recipients.length > 1 ? `${recipients[0].name} +${recipients.length - 1} staff` : recipients[0].name,
        message_sent: `${body} (${filterReason})`,
        status: 'Dispatched'
      });

      // Update execution stats
      await supabase
        .from('hr_automation_rules')
        .update({
          execution_count: (rule.execution_count || 0) + 1,
          last_run_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', rule.id);

      executedRules.push(category);
      totalNotificationsDispatched.push(recipients.length);
    }
  } catch (err: any) {
    console.error('HR Automation Cron error:', err);
    return NextResponse.json({ error: err.message || 'Cron execution failed' }, { status: 500 });
  }

  return NextResponse.json({
    success: true,
    message: `Automated Background Cron executed successfully! Processed ${executedRules.length} active triggers with real DB logic.`,
    executedRules,
    totalDispatched: totalNotificationsDispatched.reduce((a, b) => a + b, 0),
    timestamp: new Date().toISOString()
  });
}
