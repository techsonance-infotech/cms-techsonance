import { getSupabaseAdminClient } from '@/server/supabase/admin';

interface WorkflowCondition {
  field: string;
  operator: 'equals' | 'greater_than' | 'less_than' | 'contains';
  value: any;
}

interface WorkflowAction {
  type: 'webhook' | 'notification';
  url?: string;
  userId?: string;
  message?: string;
}

/**
 * Triggers and evaluates custom low-code workflows for a given tenant event
 */
export async function triggerAutomationWorkflow(
  tenantId: string,
  event: string,
  payload: Record<string, any>
) {
  const supabase = getSupabaseAdminClient();

  // 1. Fetch active workflows for this event
  const { data: workflows, error } = await supabase
    .from('automation_workflows')
    .select('*')
    .eq('tenant_id', tenantId)
    .eq('trigger_event', event)
    .eq('is_active', true);

  if (error || !workflows || workflows.length === 0) {
    return;
  }

  for (const workflow of workflows) {
    let conditionsMet = true;

    // 2. Evaluate conditions
    const conditions = (workflow.conditions as WorkflowCondition[]) || [];
    for (const cond of conditions) {
      const payloadValue = payload[cond.field];

      if (cond.operator === 'equals' && String(payloadValue) !== String(cond.value)) {
        conditionsMet = false;
        break;
      }
      if (cond.operator === 'greater_than' && Number(payloadValue) <= Number(cond.value)) {
        conditionsMet = false;
        break;
      }
      if (cond.operator === 'less_than' && Number(payloadValue) >= Number(cond.value)) {
        conditionsMet = false;
        break;
      }
      if (cond.operator === 'contains' && !String(payloadValue).includes(String(cond.value))) {
        conditionsMet = false;
        break;
      }
    }

    if (!conditionsMet) {
      continue;
    }

    // 3. Execute actions
    const actions = (workflow.actions as WorkflowAction[]) || [];
    for (const action of actions) {
      try {
        if (action.type === 'webhook' && action.url) {
          await fetch(action.url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              event,
              workflowName: workflow.name,
              timestamp: new Date().toISOString(),
              payload,
            }),
          });
        } else if (action.type === 'notification') {
          await supabase.from('notifications').insert({
            user_id: action.userId || payload.userId || null,
            title: workflow.name,
            message: action.message || `Workflow automation trigger for event: ${event}`,
            type: 'info',
            link: '/dashboard',
            is_read: false,
            tenant_id: tenantId,
            created_at: new Date().toISOString(),
          });
        }
      } catch (err: any) {
        console.error(`Automation trigger action error for workflow ${workflow.name}:`, err.message);
      }
    }
  }
}
