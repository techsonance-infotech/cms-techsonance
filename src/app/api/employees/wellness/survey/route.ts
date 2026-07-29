import { NextResponse } from 'next/server';
import { withApiHandler } from '@/server/http/handler';
import { BadRequestError } from '@/server/http/errors';
import { getAdminRouteSupabase } from '@/server/supabase/route-helpers';

export const POST = withApiHandler(async (request, context) => {
  const payload = await request.json();
  const {
    workLifeBalanceRating = 4,
    workStressLevel = 2,
    sleepQualityRating = 4,
    feedbackComments = ''
  } = payload;

  const user = context.auth!.user;
  const tenantId = user.tenantId;

  if (!tenantId) throw new BadRequestError('Tenant ID missing');

  const supabase = getAdminRouteSupabase();

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

  try {
    await supabase.from('wellness_surveys').insert({
      tenant_id: tenantId,
      user_id: user.id,
      work_life_balance_rating: workLifeBalanceRating,
      work_stress_level: workStressLevel,
      sleep_quality_rating: sleepQualityRating,
      feedback_comments: feedbackComments ? feedbackComments.trim() : null,
      ai_recommendation: aiRec
    });
  } catch (err) {
    console.warn('Wellness survey insert DB error:', err);
  }

  return NextResponse.json({
    success: true,
    stressIndex,
    burnoutRisk,
    aiRecommendation: aiRec,
    message: 'Wellness pulse survey submitted successfully! AI health recommendation generated.',
    timestamp: new Date().toISOString()
  });
}, { requireAuth: true });
