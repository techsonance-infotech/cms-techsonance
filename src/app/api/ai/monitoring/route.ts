import { NextResponse } from 'next/server';
import { withApiHandler } from '@/server/http/handler';
import { BadRequestError } from '@/server/http/errors';
import { getAiPerformanceSnapshot, getInferenceEventsForExport } from '@/server/ai/performance-monitor';
import { PROMPT_TEMPLATES } from '@/server/ai/groq-client';

export const dynamic = 'force-dynamic';

/**
 * GET /api/ai/monitoring
 * Returns real-time AI performance metrics dashboard data.
 */
export const GET = withApiHandler(async (request, context) => {
  const tenantId = context.auth?.user.tenantId;
  if (!tenantId) throw new BadRequestError('Tenant isolation info required');

  const url = new URL(request.url);
  const windowMinutes = parseInt(url.searchParams.get('window') || '1440', 10); // Default: 24h

  const snapshot = getAiPerformanceSnapshot(windowMinutes);

  // Template registry metadata
  const templateRegistry = Object.entries(PROMPT_TEMPLATES).map(([name, tpl]) => ({
    name,
    version: tpl.version,
    usageCount: snapshot.templateUsage[name] || 0
  }));

  // Recent events (last 20 for the live feed)
  const recentEvents = getInferenceEventsForExport()
    .slice(-20)
    .reverse()
    .map(e => ({
      requestId: e.requestId,
      timestamp: new Date(e.timestamp).toISOString(),
      template: e.templateName,
      model: e.modelUsed,
      tokens: e.totalTokens,
      latencyMs: e.latencyMs,
      cached: e.cached,
      success: e.success,
      dataQuality: e.dataQualityScore,
      error: e.errorMessage || null
    }));

  return NextResponse.json({
    success: true,
    monitoring: {
      // Performance Snapshot
      performance: {
        totalRequests: snapshot.totalRequests,
        successRate: snapshot.totalRequests > 0
          ? `${((snapshot.successfulRequests / snapshot.totalRequests) * 100).toFixed(1)}%`
          : '100%',
        errorRate: snapshot.errorRate,
        avgLatencyMs: snapshot.avgLatencyMs,
        p50LatencyMs: snapshot.p50LatencyMs,
        p95LatencyMs: snapshot.p95LatencyMs,
        p99LatencyMs: snapshot.p99LatencyMs
      },

      // Token Economy
      tokens: {
        totalConsumed: snapshot.totalTokensConsumed,
        avgPerRequest: snapshot.avgTokensPerRequest,
        savedByCache: snapshot.tokensSavedByCache,
        estimatedCostSaved: `$${(snapshot.tokensSavedByCache * 0.00000005).toFixed(4)}`
      },

      // Cache Metrics
      cache: {
        hitCount: snapshot.cacheHitCount,
        missCount: snapshot.cacheMissCount,
        hitRate: snapshot.cacheHitRate,
        efficiency: snapshot.cacheHitCount > 0
          ? `${((snapshot.cacheHitCount / Math.max(1, snapshot.totalRequests)) * 100).toFixed(0)}% Requests Served Free`
          : 'No cache hits yet'
      },

      // Model Routing
      modelRouting: snapshot.modelDistribution,

      // Data Quality
      dataQuality: {
        avgScore: snapshot.avgDataQualityScore,
        status: snapshot.avgDataQualityScore >= 80 ? 'Healthy' : snapshot.avgDataQualityScore >= 60 ? 'Fair' : 'Needs Improvement',
        lowQualityAlerts: snapshot.lowQualityRequestCount
      },

      // Template Registry
      templateRegistry,

      // Recent Events (Live Feed)
      recentEvents,

      // Window Info
      window: {
        minutes: windowMinutes,
        from: new Date(snapshot.windowStartMs).toISOString(),
        to: new Date(snapshot.windowEndMs).toISOString()
      }
    }
  });
}, { requireAuth: true });
