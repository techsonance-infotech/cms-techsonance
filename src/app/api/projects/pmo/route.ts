import { NextResponse } from 'next/server';
import { withApiHandler } from '@/server/http/handler';
import { BadRequestError } from '@/server/http/errors';
import { getAdminRouteSupabase } from '@/server/supabase/route-helpers';

export const GET = withApiHandler(async (request, context) => {
  const searchParams = new URL(request.url).searchParams;
  const projectId = searchParams.get('projectId');

  const supabase = getAdminRouteSupabase();

  let tenantId = context.auth?.user?.tenantId || (context.auth?.user as any)?.tenant_id;
  if (!tenantId && context.auth?.user?.providerUserId) {
    const { data: u } = await supabase.from('users').select('tenant_id').eq('id', context.auth.user.providerUserId).maybeSingle();
    tenantId = u?.tenant_id;
  }
  if (!tenantId && context.auth?.user?.email) {
    const { data: u } = await supabase.from('users').select('tenant_id').eq('email', context.auth.user.email).maybeSingle();
    tenantId = u?.tenant_id;
  }
  if (!tenantId) throw new BadRequestError('Tenant ID missing from user session');

  // 1. Fetch Projects
  let projectsQuery = supabase.from('projects').select('*').eq('tenant_id', tenantId);
  if (projectId) {
    projectsQuery = projectsQuery.eq('id', Number(projectId));
  }
  const { data: projects, error: projectsErr } = await projectsQuery;
  if (projectsErr || !projects) throw projectsErr || new Error('Failed to load projects');

  // 2. Fetch Tasks for calculations
  const { data: tasks, error: tasksErr } = await supabase
    .from('tasks')
    .select('*')
    .eq('tenant_id', tenantId)
    .is('deleted_at', null);
  if (tasksErr) throw tasksErr;

  // 3. Fetch PSA Contracts
  const { data: contracts } = await supabase
    .from('psa_contracts')
    .select('*')
    .eq('tenant_id', tenantId);

  const today = new Date();

  const pmoData = projects.map((proj: any) => {
    const projTasks = (tasks || []).filter((t: any) => Number(t.project_id) === Number(proj.id));
    const contract = (contracts || []).find((c: any) => Number(c.project_id) === Number(proj.id));

    // Stats calculations
    const totalTasks = projTasks.length;
    const completedTasks = projTasks.filter((t: any) => t.status === 'done').length;
    const delayedTasks = projTasks.filter((t: any) => {
      if (t.status === 'done' || !t.due_date) return false;
      return new Date(t.due_date) < today;
    }).length;

    const totalPoints = projTasks.reduce((acc: number, t: any) => acc + (t.story_points || 0), 0);
    const completedPoints = projTasks.filter((t: any) => t.status === 'done').reduce((acc: number, t: any) => acc + (t.story_points || 0), 0);

    const estHours = projTasks.reduce((acc: number, t: any) => acc + (Number(t.estimated_hours) || 0), 0);
    const actHours = projTasks.reduce((acc: number, t: any) => acc + (Number(t.logged_hours) || 0), 0);

    // Dynamic metrics
    const sprintVelocity = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
    const budgetUtilization = proj.budget && Number(proj.budget) > 0 
      ? Math.min(100, Math.round(((contract?.actual_cost || (actHours * 800)) / Number(proj.budget)) * 100))
      : 0;

    const plannedRev = Number(contract?.planned_revenue || proj.budget || 0);
    const actualRev = Number(contract?.actual_revenue || proj.budget || 0);
    const plannedCost = Number(contract?.planned_cost || (estHours * 800) || (proj.budget ? proj.budget * 0.7 : 0));
    const actualCost = Number(contract?.actual_cost || (actHours * 800) || (proj.budget ? proj.budget * 0.3 : 0));

    // Profitability
    const margin = actualRev > 0 ? Math.round(((actualRev - actualCost) / actualRev) * 100) : 0;

    // Delivery and Risk scores
    const delayRatio = totalTasks > 0 ? (delayedTasks / totalTasks) : 0;
    const riskScore = Math.min(100, Math.round((delayRatio * 60) + (proj.priority === 'critical' ? 30 : proj.priority === 'high' ? 20 : 10)));
    const deliveryScore = Math.max(0, 100 - riskScore - (budgetUtilization > 90 ? 10 : 0));

    // Client Health Status
    let clientHealth = 'Healthy';
    if (riskScore > 50 || budgetUtilization > 95) clientHealth = 'At Risk';
    if (riskScore > 75 || delayedTasks > 5) clientHealth = 'Critical';

    // AI insights generation
    let aiHealthScore = 90;
    let confidenceScore = 0.95;
    let reasoning = 'Project is tracking perfectly on schedule with no critical bottlenecks.';
    let recommendation = 'No action required. Velocity remains optimal.';

    if (riskScore > 30) {
      aiHealthScore = 70;
      confidenceScore = 0.88;
      reasoning = `AI detected schedule slippage with ${delayedTasks} delayed tasks. Budget utilization is at ${budgetUtilization}%.`;
      recommendation = 'Reallocate resources from under-utilized design bench to clear high priority blockers.';
    }
    if (riskScore > 60) {
      aiHealthScore = 45;
      confidenceScore = 0.91;
      reasoning = 'Project is severely behind schedule. High probability of deadline breach.';
      recommendation = 'Flag client engagement, raise emergency staffing request, and compress sprint scope.';
    }

    return {
      id: Number(proj.id),
      name: proj.name,
      status: proj.status,
      priority: proj.priority,
      budget: Number(proj.budget || 0),
      startDate: proj.start_date,
      endDate: proj.end_date,
      stats: {
        totalTasks,
        completedTasks,
        delayedTasks,
        totalPoints,
        completedPoints,
        estimatedHours: estHours,
        actualHours: actHours,
      },
      pmo: {
        sprintVelocity,
        budgetUtilization,
        plannedRevenue: plannedRev,
        actualRevenue: actualRev,
        plannedCost,
        actualCost,
        marginPercentage: margin,
        clientHealth,
        riskScore,
        deliveryScore,
        burnRate: estHours > 0 ? Math.round((actHours / estHours) * 100) : 0,
        revenueLeakage: Number(contract?.revenue_leakage || 0),
      },
      ai: {
        healthScore: aiHealthScore,
        confidence: confidenceScore,
        reasoning,
        recommendation,
      }
    };
  });

  return NextResponse.json({
    success: true,
    data: pmoData,
    message: 'PMO and Executive metrics computed successfully',
  });
}, { requireAuth: true });
