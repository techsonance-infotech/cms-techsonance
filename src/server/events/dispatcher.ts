import { logger } from '@/server/logging/logger';

export interface AuditLogParams {
  tenantId: string;
  employeeId?: number | null;
  actorId?: string | null;
  actionType: string; // 'check_in' | 'check_out' | 'regularize_request' | 'regularize_approve' | 'regularize_reject' | 'policy_update' | 'overtime_approve' | 'attendance_lock' | 'exception_resolve'
  recordId?: number | null;
  previousValues?: Record<string, any> | null;
  updatedValues?: Record<string, any> | null;
  clientIp?: string | null;
  userAgent?: string | null;
  gpsCoordinates?: string | null;
  metadata?: Record<string, any> | null;
}

/**
 * Parses user agent string to identify simple browser and OS signatures.
 */
function parseUserAgent(uaStr?: string | null) {
  if (!uaStr) return { browser: 'Unknown', os: 'Unknown' };
  
  let browser = 'Other';
  let os = 'Other';

  const ua = uaStr.toLowerCase();

  // Simple Browser Detection
  if (ua.includes('firefox')) browser = 'Firefox';
  else if (ua.includes('chrome') && !ua.includes('chromium')) browser = 'Chrome';
  else if (ua.includes('safari') && !ua.includes('chrome')) browser = 'Safari';
  else if (ua.includes('edge')) browser = 'Edge';
  else if (ua.includes('opera') || ua.includes('opr')) browser = 'Opera';

  // Simple OS Detection
  if (ua.includes('windows')) os = 'Windows';
  else if (ua.includes('macintosh') || ua.includes('mac os x')) os = 'macOS';
  else if (ua.includes('linux')) os = 'Linux';
  else if (ua.includes('android')) os = 'Android';
  else if (ua.includes('iphone') || ua.includes('ipad')) os = 'iOS';

  return { browser, os };
}

/**
 * Creates a record in the system audit log table.
 */
export async function logAuditAction(
  supabase: any,
  params: AuditLogParams
): Promise<void> {
  try {
    const { browser, os } = parseUserAgent(params.userAgent);

    const details = {
      employeeId: params.employeeId ?? null,
      recordId: params.recordId ?? null,
      previousValues: params.previousValues ?? null,
      updatedValues: params.updatedValues ?? null,
      clientIp: params.clientIp ?? null,
      userAgent: params.userAgent ?? null,
      gpsCoordinates: params.gpsCoordinates ?? null,
      browser,
      operatingSystem: os,
      ...(params.metadata ?? {}),
    };

    const { error } = await supabase
      .from('audit_logs')
      .insert({
        tenant_id: params.tenantId,
        actor_user_id: params.actorId ?? null,
        action: `ATTENDANCE_${String(params.actionType).toUpperCase()}`,
        resource_type: 'attendance',
        resource_id: params.recordId ? String(params.recordId) : null,
        method: 'POST',
        path: '/api/attendance',
        details,
        created_at: new Date().toISOString(),
      });

    if (error) {
      logger.error('Failed to write audit log:', { error: error.message, action: params.actionType });
    }
  } catch (err: any) {
    logger.error('Error during audit logging dispatch:', { error: err.message });
  }
}

/**
 * Publishes a domain event for asynchronous processing and telemetry.
 */
export async function publishDomainEvent(
  _supabase: any,
  tenantId: string,
  eventName: string,
  payload: Record<string, any>
): Promise<void> {
  try {
    logger.info(`Domain event emitted: ${eventName}`, {
      tenantId,
      eventName,
      keys: Object.keys(payload),
      timestamp: new Date().toISOString(),
    });
  } catch (err: any) {
    logger.error('Error during domain event dispatch:', { error: err.message });
  }
}
