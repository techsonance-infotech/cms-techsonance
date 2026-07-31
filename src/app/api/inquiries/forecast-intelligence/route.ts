import { withApiHandler } from '@/server/http/handler';
import { BadRequestError } from '@/server/http/errors';
import { apiSuccess } from '@/server/http/response';
import { getAdminRouteSupabase } from '@/server/supabase/route-helpers';
import { callGroqAiEngine } from '@/server/ai/groq-client';

export const GET = withApiHandler(async (request, context) => {
  const accessToken = context.auth?.accessToken;
  const tenantId = context.auth?.user.tenantId;
  if (!accessToken || !tenantId) {
    throw new BadRequestError('Authorization and tenant info required');
  }

  const supabase = getAdminRouteSupabase();

  // Fetch all active inquiries for this tenant
  const { data: rows, error } = await supabase
    .from('inquiries')
    .select('*')
    .eq('tenant_id', tenantId)
    .neq('status', 'hired'); // Focus on active pipeline (not hired / closed won)

  if (error) {
    throw error;
  }

  const inquiries = rows || [];
  const totalCount = inquiries.length;
  
  // Calculate stages count and values
  const stageStats: Record<string, { count: number; value: number }> = {
    lead: { count: 0, value: 0 },
    no_reply: { count: 0, value: 0 },
    follow_up: { count: 0, value: 0 },
    rejected_client: { count: 0, value: 0 },
    rejected_us: { count: 0, value: 0 },
  };

  let totalValue = 0;
  const missingDueDateCount = inquiries.filter((inq: any) => !inq.due_date && !inq.estimation_due_date).length;
  const missingOwnerCount = inquiries.filter((inq: any) => !inq.account_owner).length;
  const highValueNeglectedCount = inquiries.filter((inq: any) => {
    const val = inq.estimated_value !== null ? Number(inq.estimated_value) : 0;
    return val >= 500000 && (!inq.due_date && !inq.expected_start_date);
  }).length;

  inquiries.forEach((inq: any) => {
    const stage = (inq.status || 'lead').toLowerCase();
    const val = inq.estimated_value !== null ? Number(inq.estimated_value) : 0;
    totalValue += val;
    if (stageStats[stage]) {
      stageStats[stage].count += 1;
      stageStats[stage].value += val;
    } else {
      stageStats[stage] = { count: 1, value: val };
    }
  });

  // Prepare metadata summary to feed into LLM prompt
  const stageBreakdownText = Object.entries(stageStats)
    .map(([stage, stats]) => `${stage.toUpperCase()}: ${stats.count} leads (Value: ₹${stats.value.toLocaleString('en-IN')})`)
    .join('\n');

  const systemInstructions = `You are an expert CRM sales manager and pipeline forecaster AI.
Analyze this opportunity pipeline data summary. Provide 2-3 specific, actionable recommendations (max 200 characters each) focusing on missing due dates, neglected pipeline stages, or high-value leads.
Return the output in clear, plain text format, separated by bullets. Do not include markdown headers or greetings.`;

  const promptText = `Live CRM Pipeline Summary:
- Total Active Opportunities: ${totalCount}
- Combined Forecast Worth: ₹${totalValue.toLocaleString('en-IN')}
- Leads without Due Dates: ${missingDueDateCount}
- High-Value Opportunities (₹5L+) without Start Dates: ${highValueNeglectedCount}
- Opportunities lacking assigned Account Owners: ${missingOwnerCount}

Stage Breakdown:
${stageBreakdownText}

Please generate the forecast recommendations list.`;

  let aiAdviceText = '';
  let providerUsed = '';

  // Priority 1: Groq LLM Token-Optimized Engine
  if (process.env.GROQ_API_KEY) {
    try {
      const groqRes = await callGroqAiEngine({
        prompt: `${systemInstructions}\n\n${promptText}`,
        useCache: true,
      });

      if (groqRes && groqRes.answer) {
        aiAdviceText = groqRes.answer;
        providerUsed = `Groq Llama-3.1 (${groqRes.modelUsed})`;
      }
    } catch (err) {
      console.warn('Groq AI forecast API failed, trying Gemini...', err);
    }
  }

  // Priority 2: Google Gemini Fallback
  const geminiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_AI_KEY;
  if (!aiAdviceText && geminiKey) {
    try {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${geminiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [
              {
                parts: [
                  {
                    text: `${systemInstructions}\n\n${promptText}`,
                  },
                ],
              },
            ],
          }),
        }
      );

      if (response.ok) {
        const data = await response.json();
        const llmText = data?.candidates?.[0]?.content?.parts?.[0]?.text;
        if (llmText) {
          aiAdviceText = llmText;
          providerUsed = 'Google Gemini 1.5 Flash';
        }
      }
    } catch (err) {
      console.warn('Gemini AI forecast API failed...', err);
    }
  }

  // Priority 3: Local Rule Engine (Deterministic Heuristic Fallback)
  if (!aiAdviceText) {
    providerUsed = 'Deterministic CRM Analyzer (Local)';
    const recommendations: string[] = [];

    if (missingDueDateCount > 0) {
      recommendations.push(
        `• Schedule diagnostic scoping reviews for the ${missingDueDateCount} active opportunities lacking estimation timelines.`
      );
    }

    if (highValueNeglectedCount > 0) {
      recommendations.push(
        `• Target the ${highValueNeglectedCount} high-worth (₹5L+) opportunities immediately by assigning dedicated Sales and Tech Owners to draft project schedules.`
      );
    }

    if (missingOwnerCount > 0) {
      recommendations.push(
        `• Assign Account Owners to the ${missingOwnerCount} unowned leads in the pipeline stage to ensure clear response tracking.`
      );
    }

    if (stageStats.follow_up.count > 0) {
      recommendations.push(
        `• Initiate alternate communications (WhatsApp/Phone call) for the ${stageStats.follow_up.count} opportunities in the Follow Up pipeline stage.`
      );
    }

    if (recommendations.length === 0) {
      recommendations.push(
        `• Your opportunity pipeline is healthy! Continue monitoring upcoming negotiation dates and active estimations.`
      );
    }

    aiAdviceText = recommendations.join('\n');
  }

  return apiSuccess({
    advice: aiAdviceText,
    provider: providerUsed,
    totalValue,
    totalCount,
    missingDueDateCount,
  }, 'CRM Forecast Analytics calculated successfully');
}, { requireAuth: true, roles: ['Employee'] });
