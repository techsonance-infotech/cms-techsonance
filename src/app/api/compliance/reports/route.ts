import { NextResponse } from 'next/server';
import { withApiHandler } from '@/server/http/handler';
import { BadRequestError } from '@/server/http/errors';
import { runComplianceEngineScan } from '@/server/compliance/compliance-engine';

export const GET = withApiHandler(async (request, context) => {
  const user = context.auth!.user;
  const tenantId = user.tenantId;

  if (!tenantId) throw new BadRequestError('Tenant ID missing');

  const url = new URL(request.url);
  const type = url.searchParams.get('type') || 'summary';

  const scan = await runComplianceEngineScan(tenantId);

  if (type === 'summary') {
    return NextResponse.json({
      success: true,
      globalScore: scan.globalScore,
      totalViolations: scan.violations.length,
      criticalCount: scan.violations.filter(v => v.severity === 'Critical').length,
      highCount: scan.violations.filter(v => v.severity === 'High').length,
      mediumCount: scan.violations.filter(v => v.severity === 'Medium').length,
      lowCount: scan.violations.filter(v => v.severity === 'Low').length,
      resolvedCount: scan.violations.filter(v => v.status === 'Resolved').length
    });
  }

  if (type === 'department') {
    return NextResponse.json({
      success: true,
      departmentScores: scan.departmentScores
    });
  }

  if (type === 'violations') {
    // Group violations by category for reporting charts
    const categoryCounts: Record<string, number> = {};
    for (const v of scan.violations) {
      categoryCounts[v.category] = (categoryCounts[v.category] || 0) + 1;
    }

    const categories = Object.keys(categoryCounts).map(cat => ({
      category: cat,
      count: categoryCounts[cat]
    }));

    return NextResponse.json({
      success: true,
      categoryStats: categories,
      violations: scan.violations
    });
  }

  if (type === 'expiry-forecast') {
    return NextResponse.json({
      success: true,
      forecast: scan.upcomingDeadlines
    });
  }

  throw new BadRequestError(`Unknown report type: ${type}`);
}, { requireAuth: true });
