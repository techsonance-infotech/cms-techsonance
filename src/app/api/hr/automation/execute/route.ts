import { NextResponse } from 'next/server';
import { withApiHandler } from '@/server/http/handler';
import { BadRequestError } from '@/server/http/errors';
import { getAdminRouteSupabase } from '@/server/supabase/route-helpers';
import { evaluateHrAutomationTrigger } from '@/server/hr-automation/evaluator';

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
function toValidUuid(val: string | null | undefined): string | null {
  if (!val) return null;
  return UUID_REGEX.test(val) ? val : null;
}

export const POST = withApiHandler(async (request, context) => {
  const payload = await request.json();
  const {
    category = 'AI-generated Daily Digest'
  } = payload;

  const user = context.auth!.user;
  const tenantId = user.tenantId;

  if (!tenantId) throw new BadRequestError('Tenant ID missing');

  const supabase = getAdminRouteSupabase();

  // Evaluate real database logic and filter target recipients
  const evaluation = await evaluateHrAutomationTrigger(tenantId, category, String(user.id));
  const { title, body, recipients, filterReason } = evaluation;

  // 1. Dispatch notifications into notifications table
  try {
    const notifs = recipients
      .map(r => {
        const targetUserId = toValidUuid(r.userId) || toValidUuid(String(user.id));
        if (!targetUserId) return null;
        return {
          tenant_id: tenantId,
          user_id: targetUserId,
          title,
          message: body,
          type: 'info',
          is_read: false,
          created_at: new Date().toISOString()
        };
      })
      .filter(Boolean);

    if (notifs.length > 0) {
      await supabase.from('notifications').insert(notifs);
    }
  } catch (err) {
    console.warn('Notifications insert warning:', err);
  }

  // 2. Record execution log in hr_automation_logs table (Safe UUID handling)
  const firstRecipient = recipients[0];
  const validUserId = toValidUuid(firstRecipient?.userId) || toValidUuid(String(user.id));
  const recipientName = recipients.length > 1 
    ? `${firstRecipient?.name || 'Employee'} (+${recipients.length - 1} staff)` 
    : (firstRecipient?.name || 'Employee');

  try {
    const { error: logErr } = await supabase.from('hr_automation_logs').insert({
      tenant_id: tenantId,
      rule_category: category,
      recipient_user_id: validUserId,
      recipient_name: recipientName,
      message_sent: `${body} (${filterReason})`,
      status: 'Dispatched'
    });

    if (logErr) {
      console.error('HR Automation log DB insert error:', logErr);
    }
  } catch (err) {
    console.error('HR Automation execution log error:', err);
  }

  // 3. Update execution_count & last_run_at in hr_automation_rules table
  try {
    const { data: existing } = await supabase
      .from('hr_automation_rules')
      .select('id, execution_count')
      .eq('tenant_id', tenantId)
      .eq('category', category)
      .maybeSingle();

    if (existing) {
      await supabase
        .from('hr_automation_rules')
        .update({
          execution_count: (existing.execution_count || 0) + 1,
          last_run_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', existing.id);
    } else {
      await supabase
        .from('hr_automation_rules')
        .insert({
          tenant_id: tenantId,
          rule_name: category,
          category,
          is_enabled: true,
          execution_count: 1,
          last_run_at: new Date().toISOString(),
          template_body: body
        });
    }
  } catch (err) {
    console.warn('Rule stats update warning:', err);
  }

  return NextResponse.json({
    success: true,
    message: `HR Automation (${category}): Dispatched to ${recipients.length} target recipient(s)! ${filterReason}`,
    category,
    recipientCount: recipients.length,
    filterReason,
    timestamp: new Date().toISOString()
  });
}, { requireAuth: true });
