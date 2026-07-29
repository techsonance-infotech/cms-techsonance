/**
 * AI Performance Telemetry & Monitoring Engine
 * =============================================
 * Tracks real-time AI inference performance metrics:
 * - Latency (p50, p95, p99)
 * - Token consumption per request & cumulative
 * - Cache hit/miss ratio
 * - Model routing distribution
 * - Error rates & fallback frequency
 * - Data quality scoring
 * - Prompt template effectiveness
 *
 * All metrics stored in-memory with periodic DB persistence.
 */

export interface AiInferenceEvent {
  requestId: string;
  timestamp: number;
  templateName: string;
  modelUsed: string;
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
  latencyMs: number;
  cached: boolean;
  success: boolean;
  errorMessage?: string;
  dataQualityScore: number; // 0-100
  complexity: 'simple' | 'complex';
}

export interface AiPerformanceSnapshot {
  // Request Metrics
  totalRequests: number;
  successfulRequests: number;
  failedRequests: number;
  errorRate: string;

  // Latency Metrics (milliseconds)
  avgLatencyMs: number;
  p50LatencyMs: number;
  p95LatencyMs: number;
  p99LatencyMs: number;

  // Token Consumption
  totalTokensConsumed: number;
  avgTokensPerRequest: number;
  tokensSavedByCache: number;

  // Cache Performance
  cacheHitCount: number;
  cacheMissCount: number;
  cacheHitRate: string;

  // Model Routing Distribution
  modelDistribution: Record<string, number>;

  // Data Quality
  avgDataQualityScore: number;
  lowQualityRequestCount: number;

  // Template Usage
  templateUsage: Record<string, number>;

  // Time Window
  windowStartMs: number;
  windowEndMs: number;
}

// Rolling window event buffer (last 1000 events, ~24h for typical usage)
const MAX_EVENT_BUFFER = 1000;
const inferenceEvents: AiInferenceEvent[] = [];

// Cumulative counters (persist across cache evictions)
let cumulativeTokensConsumed = 0;
let cumulativeTokensSavedByCache = 0;
let cumulativeRequests = 0;

/**
 * Records an AI inference event for monitoring.
 */
export function recordAiInferenceEvent(event: AiInferenceEvent): void {
  inferenceEvents.push(event);
  cumulativeRequests++;

  if (event.cached) {
    // Estimate tokens saved: avg of 200 tokens per cached response
    cumulativeTokensSavedByCache += event.totalTokens || 200;
  } else {
    cumulativeTokensConsumed += event.totalTokens;
  }

  // Evict oldest events if buffer exceeds max
  if (inferenceEvents.length > MAX_EVENT_BUFFER) {
    inferenceEvents.splice(0, inferenceEvents.length - MAX_EVENT_BUFFER);
  }
}

/**
 * Computes a real-time performance snapshot from the event buffer.
 */
export function getAiPerformanceSnapshot(windowMinutes?: number): AiPerformanceSnapshot {
  const now = Date.now();
  const windowMs = (windowMinutes || 1440) * 60 * 1000; // Default: 24 hours
  const windowStart = now - windowMs;

  const windowEvents = inferenceEvents.filter(e => e.timestamp >= windowStart);

  const totalRequests = windowEvents.length;
  const successfulRequests = windowEvents.filter(e => e.success).length;
  const failedRequests = totalRequests - successfulRequests;
  const errorRate = totalRequests > 0
    ? `${((failedRequests / totalRequests) * 100).toFixed(2)}%`
    : '0.00%';

  // Latency percentiles
  const latencies = windowEvents
    .filter(e => !e.cached && e.success)
    .map(e => e.latencyMs)
    .sort((a, b) => a - b);

  const avgLatencyMs = latencies.length > 0
    ? Math.round(latencies.reduce((s, v) => s + v, 0) / latencies.length)
    : 0;
  const p50LatencyMs = percentile(latencies, 50);
  const p95LatencyMs = percentile(latencies, 95);
  const p99LatencyMs = percentile(latencies, 99);

  // Token consumption
  const windowTokens = windowEvents
    .filter(e => !e.cached)
    .reduce((s, e) => s + e.totalTokens, 0);
  const avgTokensPerRequest = totalRequests > 0
    ? Math.round(windowTokens / Math.max(1, windowEvents.filter(e => !e.cached).length))
    : 0;

  // Cache metrics
  const cacheHitCount = windowEvents.filter(e => e.cached).length;
  const cacheMissCount = totalRequests - cacheHitCount;
  const cacheHitRate = totalRequests > 0
    ? `${((cacheHitCount / totalRequests) * 100).toFixed(1)}%`
    : '0.0%';

  // Model routing distribution
  const modelDistribution: Record<string, number> = {};
  windowEvents.forEach(e => {
    modelDistribution[e.modelUsed] = (modelDistribution[e.modelUsed] || 0) + 1;
  });

  // Data quality
  const qualityScores = windowEvents.map(e => e.dataQualityScore).filter(s => s > 0);
  const avgDataQualityScore = qualityScores.length > 0
    ? Math.round(qualityScores.reduce((s, v) => s + v, 0) / qualityScores.length)
    : 100;
  const lowQualityRequestCount = windowEvents.filter(e => e.dataQualityScore < 60).length;

  // Template usage
  const templateUsage: Record<string, number> = {};
  windowEvents.forEach(e => {
    if (e.templateName) {
      templateUsage[e.templateName] = (templateUsage[e.templateName] || 0) + 1;
    }
  });

  return {
    totalRequests,
    successfulRequests,
    failedRequests,
    errorRate,
    avgLatencyMs,
    p50LatencyMs,
    p95LatencyMs,
    p99LatencyMs,
    totalTokensConsumed: cumulativeTokensConsumed,
    avgTokensPerRequest,
    tokensSavedByCache: cumulativeTokensSavedByCache,
    cacheHitCount,
    cacheMissCount,
    cacheHitRate,
    modelDistribution,
    avgDataQualityScore,
    lowQualityRequestCount,
    templateUsage,
    windowStartMs: windowStart,
    windowEndMs: now
  };
}

/**
 * Computes data quality score for a given telemetry input.
 * Score = 100 if all fields present; deductions for nulls/zeros/missing.
 */
export function computeDataQualityScore(fields: Record<string, any>): number {
  const entries = Object.entries(fields);
  if (entries.length === 0) return 0;

  let validCount = 0;
  for (const [, value] of entries) {
    if (value !== null && value !== undefined && value !== '' && value !== 0) {
      validCount++;
    }
  }

  return Math.round((validCount / entries.length) * 100);
}

/**
 * Returns the event buffer for DB persistence or export.
 */
export function getInferenceEventsForExport(): AiInferenceEvent[] {
  return [...inferenceEvents];
}

/**
 * Clears the in-memory event buffer (e.g. after DB persistence).
 */
export function clearInferenceEventBuffer(): void {
  inferenceEvents.length = 0;
}

// Utility: compute percentile from sorted array
function percentile(sortedArr: number[], pct: number): number {
  if (sortedArr.length === 0) return 0;
  const idx = Math.ceil((pct / 100) * sortedArr.length) - 1;
  return sortedArr[Math.max(0, Math.min(idx, sortedArr.length - 1))];
}
