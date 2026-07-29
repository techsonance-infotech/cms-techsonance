import { NextResponse } from 'next/server';
import { withApiHandler } from '@/server/http/handler';
import { BadRequestError } from '@/server/http/errors';
import { getAdminRouteSupabase } from '@/server/supabase/route-helpers';
import { runComplianceEngineScan } from '@/server/compliance/compliance-engine';
import { generateComplianceRiskAssessment, askComplianceCopilot } from '@/server/compliance/ai-compliance-advisor';

export const POST = withApiHandler(async (request, context) => {
  const user = context.auth!.user;
  const tenantId = user.tenantId;

  if (!tenantId) throw new BadRequestError('Tenant ID missing');

  const body = await request.json();
  const { action, query, violationId } = body;

  if (!action) {
    throw new BadRequestError('Action is required');
  }

  // Run a quick scan to get updated context data
  const scan = await runComplianceEngineScan(tenantId);

  if (action === 'risk_assessment') {
    const risk = await generateComplianceRiskAssessment(scan.violations, scan.departmentScores);
    return NextResponse.json({ success: true, risk });
  }

  if (action === 'nl_query') {
    if (!query) throw new BadRequestError('Query is required for nl_query action');
    const answer = await askComplianceCopilot(query, scan.violations, scan.employeeScores, scan.upcomingDeadlines);
    return NextResponse.json({ success: true, answer: answer.answer, confidence: answer.confidence });
  }

  if (action === 'recommend_actions') {
    if (!violationId) throw new BadRequestError('Violation ID is required for recommend_actions action');
    const targetViolation = scan.violations.find(v => v.id === violationId);
    
    if (!targetViolation) {
      return NextResponse.json({
        success: true,
        recommendation: 'Check item verification status. Verify validity dates, contact the employee, and log standard corrective action.'
      });
    }

    // Dynamic mock fallback or call copilot
    const queryStr = `What corrective actions should be taken for violation: "${targetViolation.title}" - Description: "${targetViolation.description}"?`;
    const ans = await askComplianceCopilot(queryStr, [targetViolation], [], []);
    
    return NextResponse.json({
      success: true,
      recommendation: ans.answer
    });
  }

  throw new BadRequestError(`Unknown action: ${action}`);
}, { requireAuth: true });
