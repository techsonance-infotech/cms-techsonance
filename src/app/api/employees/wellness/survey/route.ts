import { NextResponse } from 'next/server';
import { withApiHandler } from '@/server/http/handler';
import { BadRequestError } from '@/server/http/errors';
import { getAdminRouteSupabase, resolveTenantId, resolveActorUuid } from '@/server/supabase/route-helpers';

export const GET = withApiHandler(async (request, context) => {
  const supabase = getAdminRouteSupabase();
  const tenantId = await resolveTenantId(context, supabase);
  if (!tenantId) throw new BadRequestError('Tenant information required');

  const user = context.auth!.user;
  const userRole = (user.role || '').toLowerCase().replace(/[^a-z0-9_]/g, '');
  const canApprove = ['admin', 'hr_manager', 'project_manager'].includes(userRole);
  const currentActorId = await resolveActorUuid(context, supabase);

  // Fetch users to map user names and designations
  let usersList: any[] = [];
  try {
    const { data } = await supabase
      .from('users')
      .select('id, first_name, last_name, email, role')
      .eq('tenant_id', tenantId);
    if (data) usersList = data;
  } catch (err) {
    console.warn('Users fetch error in surveys:', err);
  }
  const userMap = new Map(usersList.map((u: any) => [u.id, u]));

  let employeesList: any[] = [];
  try {
    const { data } = await supabase
      .from('employees')
      .select('id, user_id, department, designation')
      .eq('tenant_id', tenantId);
    if (data) employeesList = data;
  } catch (err) {
    console.warn('Employees fetch error in surveys:', err);
  }
  const empMap = new Map(employeesList.map((e: any) => [e.user_id, e]));

  let query = supabase
    .from('wellness_surveys')
    .select('*')
    .eq('tenant_id', tenantId)
    .order('created_at', { ascending: false });

  // If not admin, restrict to employee's own surveys
  if (!canApprove && currentActorId) {
    query = query.eq('user_id', currentActorId);
  }

  const { data: dbSurveys, error } = await query;
  if (error) throw new BadRequestError(error.message);

  const surveys = (dbSurveys || []).map((s: any) => {
    const targetUser = userMap.get(s.user_id);
    const targetEmp = empMap.get(s.user_id);
    const employeeName = targetUser
      ? `${targetUser.first_name || ''} ${targetUser.last_name || ''}`.trim() || targetUser.email
      : 'Employee';

    return {
      id: s.id,
      userId: s.user_id,
      employeeName,
      department: targetEmp?.department || 'General',
      designation: targetEmp?.designation || (targetUser?.role ? targetUser.role.toUpperCase() : 'Staff Member'),
      workLifeBalanceRating: s.work_life_balance_rating,
      workStressLevel: s.work_stress_level,
      sleepQualityRating: s.sleep_quality_rating,
      feedbackComments: s.feedback_comments,
      aiRecommendation: s.ai_recommendation,
      createdAt: s.created_at
    };
  });

  // Calculate Aggregates
  const totalResponses = surveys.length;
  let avgWlb = 0;
  let avgStress = 0;
  let avgSleep = 0;

  if (totalResponses > 0) {
    const sumWlb = surveys.reduce((acc: number, cur: any) => acc + (cur.workLifeBalanceRating || 0), 0);
    const sumStress = surveys.reduce((acc: number, cur: any) => acc + (cur.workStressLevel || 0), 0);
    const sumSleep = surveys.reduce((acc: number, cur: any) => acc + (cur.sleepQualityRating || 0), 0);

    avgWlb = Number((sumWlb / totalResponses).toFixed(1));
    avgStress = Number((sumStress / totalResponses).toFixed(1));
    avgSleep = Number((sumSleep / totalResponses).toFixed(1));
  }

  return NextResponse.json({
    success: true,
    surveys,
    analytics: {
      totalResponses,
      avgWorkLifeBalance: avgWlb,
      avgStressLevel: avgStress,
      avgSleepQuality: avgSleep
    }
  });
}, { requireAuth: true });

export const POST = withApiHandler(async (request, context) => {
  const payload = await request.json();
  const {
    workLifeBalanceRating = 4,
    workStressLevel = 2,
    sleepQualityRating = 4,
    feedbackComments = ''
  } = payload;

  const supabase = getAdminRouteSupabase();
  const tenantId = await resolveTenantId(context, supabase);
  if (!tenantId) throw new BadRequestError('Tenant information required');

  const actorId = await resolveActorUuid(context, supabase);
  if (!actorId) throw new BadRequestError('Authenticated user profile not found');

  // AI Stress Index Calculation (Scale 1 to 100)
  const stressIndex = Math.max(10, Math.min(95, Math.round(((6 - workLifeBalanceRating) * 15) + (workStressLevel * 18) + ((5 - sleepQualityRating) * 12))));
  
  let burnoutRisk = 'Low';
  if (stressIndex > 70) burnoutRisk = 'High';
  else if (stressIndex > 45) burnoutRisk = 'Moderate';

  let aiRec = `AI Copilot Health Index (${stressIndex}% Stress): Excellent work-life balance! Keep up your regular hydration and 15-minute ergonomic stretch breaks.`;
  if (stressIndex > 70) {
    aiRec = `AI Copilot High Fatigue Warning (${stressIndex}% Stress): Workload fatigue detected. We strongly recommend scheduling a confidential 1-on-1 EAP counselling session and taking 1 day of wellness leave.`;
  } else if (stressIndex > 45) {
    aiRec = `AI Copilot Moderate Stress Notice (${stressIndex}% Stress): Moderate workload pressure detected. Consider attending our weekly Mindfulness & Meditation Workshop.`;
  }

  const { data, error } = await supabase
    .from('wellness_surveys')
    .insert({
      tenant_id: tenantId,
      user_id: actorId,
      work_life_balance_rating: workLifeBalanceRating,
      work_stress_level: workStressLevel,
      sleep_quality_rating: sleepQualityRating,
      feedback_comments: feedbackComments ? feedbackComments.trim() : null,
      ai_recommendation: aiRec
    })
    .select()
    .single();

  if (error) throw new BadRequestError(error.message);

  return NextResponse.json({
    success: true,
    stressIndex,
    burnoutRisk,
    aiRecommendation: aiRec,
    data,
    message: 'Wellness pulse survey submitted successfully! AI health recommendation generated.',
    timestamp: new Date().toISOString()
  }, { status: 201 });
}, { requireAuth: true });
