import { NextResponse } from 'next/server';
import { withApiHandler } from '@/server/http/handler';
import { BadRequestError } from '@/server/http/errors';
import { getAdminRouteSupabase } from '@/server/supabase/route-helpers';
import { callGroqAiEngine } from '@/server/ai/groq-client';

const PIPELINE_STAGES = [
  'New Lead',
  'Qualified',
  'Discovery',
  'Proposal Sent',
  'Negotiation',
  'Contract Review',
  'Won',
  'Lost',
  'On Hold'
];

export const GET = withApiHandler(async (request, context) => {
  const user = context.auth!.user;
  const tenantId = user.tenantId;

  if (!tenantId) throw new BadRequestError('Tenant ID missing');

  const supabase = getAdminRouteSupabase();

  // Fetch all inquiries with pipeline/opportunity data
  const { data: inquiries, error } = await supabase
    .from('inquiries')
    .select('*')
    .eq('tenant_id', tenantId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Pipeline fetch error:', error);
  }

  const allInquiries = inquiries || [];

  // Fetch clients for name mapping
  const { data: clients } = await supabase
    .from('clients')
    .select('id, name, company_name')
    .eq('tenant_id', tenantId);

  const clientMap = new Map((clients || []).map((c: any) => [c.id, c.company_name || c.name]));

  // Normalize pipeline deals
  const deals = allInquiries.map((inq: any) => {
    const stage = inq.pipeline_stage || 'New Lead';
    const value = inq.estimated_value ? Number(inq.estimated_value) : 0;
    const prob = inq.probability ? parseInt(inq.probability) : 0;

    return {
      id: inq.id,
      name: inq.alias_name || inq.company_name || `Deal #${inq.id}`,
      companyName: inq.company_name || '',
      contactPerson: inq.contact_person || '',
      email: inq.work_email || '',
      phone: inq.phone_number || '',
      stage,
      value,
      probability: prob,
      priorityLevel: inq.priority_level || 'Medium',
      opportunityStatus: inq.opportunity_status || 'Open',
      dueDate: inq.due_date || null,
      expectedCloseDate: inq.estimation_due_date || null,
      expectedStartDate: inq.expected_start_date || null,
      source: inq.inquiry_source || '',
      accountOwner: inq.account_owner || '',
      salesManager: inq.sales_manager || '',
      technicalLead: inq.technical_lead || '',
      budgetRange: inq.budget_range || '',
      timeline: inq.timeline || '',
      industry: inq.industry || '',
      status: inq.status || '',
      notes: inq.internal_notes || '',
      createdAt: inq.created_at,
      updatedAt: inq.updated_at,
      tag: inq.tag || ''
    };
  });

  // Build stage-wise pipeline statistics
  const stageStats = PIPELINE_STAGES.map(stage => {
    const stageDeals = deals.filter((d: any) => d.stage === stage);
    const totalValue = stageDeals.reduce((s: number, d: any) => s + d.value, 0);
    const avgProb = stageDeals.length > 0
      ? Math.round(stageDeals.reduce((s: number, d: any) => s + d.probability, 0) / stageDeals.length)
      : 0;
    return {
      stage,
      count: stageDeals.length,
      totalValue,
      averageProbability: avgProb
    };
  });

  // Compute KPIs
  const totalDeals = deals.length;
  const totalPipelineValue = deals.reduce((s: number, d: any) => s + d.value, 0);
  const wonDeals = deals.filter((d: any) => d.stage === 'Won');
  const lostDeals = deals.filter((d: any) => d.stage === 'Lost');
  const wonValue = wonDeals.reduce((s: number, d: any) => s + d.value, 0);
  const lostValue = lostDeals.reduce((s: number, d: any) => s + d.value, 0);
  const activeDeals = deals.filter((d: any) => !['Won', 'Lost'].includes(d.stage));
  const activePipelineValue = activeDeals.reduce((s: number, d: any) => s + d.value, 0);
  const weightedPipelineValue = activeDeals.reduce((s: number, d: any) => s + (d.value * d.probability / 100), 0);
  const conversionRate = totalDeals > 0 ? Math.round((wonDeals.length / totalDeals) * 100) : 0;
  const avgDealValue = totalDeals > 0 ? Math.round(totalPipelineValue / totalDeals) : 0;

  // AI Sales Intelligence
  let aiInsights = null;
  try {
    const pipelineSummary = stageStats.map(s => `${s.stage}: ${s.count} deals, ₹${s.totalValue.toLocaleString('en-IN')}`).join('; ');
    const prompt = `You are an AI sales advisor. Analyze this sales pipeline and return JSON with these fields:
    - "pipelineHealthScore" (0-100 integer)
    - "winPrediction" (string, 1-2 sentences on expected wins)
    - "riskAlerts" (array of max 3 short risk strings)
    - "recommendations" (array of max 3 short actionable recommendation strings)
    - "revenueProjection" (string, estimated revenue in next 30 days)

    Pipeline data: ${pipelineSummary}
    Total deals: ${totalDeals}, Won: ${wonDeals.length}, Lost: ${lostDeals.length}, Active pipeline value: ₹${activePipelineValue.toLocaleString('en-IN')}, Conversion rate: ${conversionRate}%

    Return ONLY valid JSON, no markdown.`;

    const groqRes = await callGroqAiEngine({ prompt, useCache: true });
    const responseText = groqRes?.answer || '';
    if (responseText) {
      try {
        const cleaned = responseText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
        aiInsights = JSON.parse(cleaned);
      } catch {
        aiInsights = { pipelineHealthScore: conversionRate, winPrediction: 'Unable to generate prediction.', riskAlerts: [], recommendations: [], revenueProjection: '—' };
      }
    }
  } catch (aiErr) {
    console.error('AI pipeline insights error:', aiErr);
    // Fallback: compute basic insights from data
    aiInsights = {
      pipelineHealthScore: Math.min(100, Math.max(0, conversionRate + (activeDeals.length > 0 ? 20 : 0))),
      winPrediction: activeDeals.length > 0 ? `${activeDeals.length} active deals in pipeline with ₹${activePipelineValue.toLocaleString('en-IN')} potential value.` : 'No active deals in pipeline.',
      riskAlerts: lostDeals.length > wonDeals.length ? ['Loss rate exceeds win rate — review qualification criteria.'] : [],
      recommendations: activeDeals.length > 0 ? ['Focus on advancing deals in Negotiation stage.'] : ['Add new leads to build pipeline.'],
      revenueProjection: `₹${Math.round(weightedPipelineValue).toLocaleString('en-IN')}`
    };
  }

  return NextResponse.json({
    success: true,
    deals,
    stages: PIPELINE_STAGES,
    stageStats,
    kpis: {
      totalDeals,
      totalPipelineValue,
      activePipelineValue,
      weightedPipelineValue: Math.round(weightedPipelineValue),
      wonCount: wonDeals.length,
      wonValue,
      lostCount: lostDeals.length,
      lostValue,
      activeCount: activeDeals.length,
      conversionRate,
      avgDealValue
    },
    aiInsights,
    clients: clients || []
  });
}, { requireAuth: true, roles: ['Manager'] });

// Update deal stage (drag-and-drop or manual)
export const PUT = withApiHandler(async (request, context) => {
  const user = context.auth!.user;
  const tenantId = user.tenantId;

  if (!tenantId) throw new BadRequestError('Tenant ID missing');

  const supabase = getAdminRouteSupabase();
  const body = await request.json();

  if (!body.id) throw new BadRequestError('Missing deal ID');

  const updatePayload: Record<string, any> = {};

  if (body.pipeline_stage !== undefined) {
    updatePayload.pipeline_stage = body.pipeline_stage;
    // Auto-update opportunity_status based on stage
    if (body.pipeline_stage === 'Won') updatePayload.opportunity_status = 'Won';
    else if (body.pipeline_stage === 'Lost') updatePayload.opportunity_status = 'Lost';
    else if (body.pipeline_stage === 'On Hold') updatePayload.opportunity_status = 'On Hold';
    else updatePayload.opportunity_status = 'Open';
  }
  if (body.priority_level !== undefined) updatePayload.priority_level = body.priority_level;
  if (body.estimated_value !== undefined) updatePayload.estimated_value = body.estimated_value;
  if (body.probability !== undefined) updatePayload.probability = String(body.probability);
  if (body.account_owner !== undefined) updatePayload.account_owner = body.account_owner;

  if (Object.keys(updatePayload).length === 0) {
    throw new BadRequestError('No update fields provided');
  }

  const { data, error } = await supabase
    .from('inquiries')
    .update(updatePayload)
    .eq('id', body.id)
    .eq('tenant_id', tenantId)
    .select('*')
    .single();

  if (error) {
    console.error('Pipeline deal update failed:', error);
    return NextResponse.json({ success: false, error: 'Failed to update deal stage.' }, { status: 500 });
  }

  return NextResponse.json({ success: true, data });
}, { requireAuth: true, roles: ['Manager'] });
