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
 * Creates an immutable record in the compliance audit log table.
 */
export async function logAuditAction(
  supabase: any,
  params: AuditLogParams
): Promise<void> {
  try {
    const { browser, os } = parseUserAgent(params.userAgent);

    const { error } = await supabase
      .from('immutable_audit_logs')
      .insert({
        tenant_id: params.tenantId,
        employee_id: params.employeeId ?? null,
        actor_id: params.actorId ?? null,
        action_type: params.actionType,
        attendance_record_id: params.recordId ?? null,
        previous_values: params.previousValues ?? null,
        updated_values: params.updatedValues ?? null,
        client_ip: params.clientIp ?? null,
        user_agent: params.userAgent ?? null,
        gps_coordinates: params.gpsCoordinates ?? null,
        browser,
        operating_system: os,
        metadata: params.metadata ?? {},
        created_at: new Date().toISOString(),
      });

    if (error) {
      logger.error('Failed to write immutable audit log:', { error: error.message, action: params.actionType });
    }
  } catch (err: any) {
    logger.error('Error during audit logging dispatch:', { error: err.message });
  }
}

/**
 * Publishes a domain event to the database queue for asynchronous downstream syncs.
 */
export async function publishDomainEvent(
  supabase: any,
  tenantId: string,
  eventName: string,
  payload: Record<string, any>
): Promise<void> {
  try {
    const { error } = await supabase
      .from('domain_events')
      .insert({
        tenant_id: tenantId,
        event_name: eventName,
        payload,
        processed: false,
        created_at: new Date().toISOString(),
      });

    if (error) {
      logger.error('Failed to publish domain event:', { error: error.message, eventName });
    } else {
      // Simulate real-time background event trigger for demonstration/dashboard updates
      logger.info(`Domain event emitted: ${eventName}`, { tenantId, keys: Object.keys(payload) });
    }
  } catch (err: any) {
    logger.error('Error during domain event dispatch:', { error: err.message });
  }
}
