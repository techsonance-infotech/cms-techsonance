import { callGroqAiEngine } from '@/server/ai/groq-client';
import { logger } from '@/server/logging/logger';

export interface AnomalyCheckInput {
  employeeId: number;
  date: string;
  timeIn: string;
  timeOut?: string | null;
  location?: string | null;
  locationLatitude?: number | null;
  locationLongitude?: number | null;
  officeLatitude?: number | null;
  officeLongitude?: number | null;
  geofenceRadiusMeters?: number;
  allowedIps?: string;
  clientIp?: string | null;
  userAgent?: string | null;
  shiftStart?: string;
  shiftEnd?: string;
  recentPunchTimes?: string[]; // ISO strings of recent check-ins for the employee
}

export interface AnomalyDetectionResult {
  isAnomaly: boolean;
  anomalyType: 'buddy_punching' | 'gps_spoofing' | 'abnormal_schedule' | 'unauthorized_location' | 'ip_violation' | 'none';
  confidenceScore: number; // 0.0 to 100.0
  details: string;
  recommendation: string;
}

/**
 * Invokes Groq AI engine to audit a check-in transaction for fraud/anomalies.
 */
export async function detectAttendanceAnomaly(
  input: AnomalyCheckInput
): Promise<AnomalyDetectionResult> {
  const apiKey = process.env.GROQ_API_KEY;

  // Heuristic fallbacks in case GROQ_API_KEY is not configured
  const heuristicResult: AnomalyDetectionResult = {
    isAnomaly: false,
    anomalyType: 'none',
    confidenceScore: 0.0,
    details: 'No anomalies detected by baseline heuristics.',
    recommendation: 'None',
  };

  // Run quick heuristic checks first (Backend Calculations & Aggregations first rule)
  if (input.locationLatitude && input.locationLongitude && input.officeLatitude && input.officeLongitude) {
    const { calculateDistanceMeters } = await import('@/server/utils/geolocation');
    const distance = calculateDistanceMeters(
      input.locationLatitude,
      input.locationLongitude,
      input.officeLatitude,
      input.officeLongitude
    );
    const radius = input.geofenceRadiusMeters || 500;
    if (distance > radius) {
      heuristicResult.isAnomaly = true;
      heuristicResult.anomalyType = 'unauthorized_location';
      heuristicResult.confidenceScore = 95.0;
      heuristicResult.details = `Punch location is outside allowed geofence. Distance: ${Math.round(distance)}m (Allowed: ${radius}m).`;
      heuristicResult.recommendation = 'Verify with employee if they were on outdoor assignment or client visit.';
    }
  }

  if (input.allowedIps && input.clientIp) {
    const allowedList = input.allowedIps.split(',').map(ip => ip.trim());
    if (allowedList.length > 0 && allowedList[0] !== '' && !allowedList.includes(input.clientIp)) {
      heuristicResult.isAnomaly = true;
      heuristicResult.anomalyType = 'ip_violation';
      heuristicResult.confidenceScore = 90.0;
      heuristicResult.details = `Punch recorded from unauthorized IP address: ${input.clientIp}.`;
      heuristicResult.recommendation = 'Audit network usage or verify if punch was made via office Wi-Fi.';
    }
  }

  if (!apiKey) {
    return heuristicResult;
  }

  try {
    const systemPrompt = `You are an AI Workforce Compliance Officer. Audit the check-in transaction and determine if there is an anomaly or fraud (e.g. GPS spoofing, buddy punching, or abnormal schedule). You must output JSON format only matching: {"isAnomaly": boolean, "anomalyType": "buddy_punching"|"gps_spoofing"|"abnormal_schedule"|"unauthorized_location"|"ip_violation"|"none", "confidenceScore": float, "details": "string", "recommendation": "string"}. Keep descriptions highly concise.`;

    const userPrompt = `
Transaction Details:
- Date: ${input.date}
- Punch Time: ${input.timeIn}
- Employee ID: ${input.employeeId}
- Client IP: ${input.clientIp || 'Unknown'}
- User Agent: ${input.userAgent || 'Unknown'}
- Location: LAT: ${input.locationLatitude || 'N/A'}, LONG: ${input.locationLongitude || 'N/A'}
- Office Coordinates: LAT: ${input.officeLatitude || 'N/A'}, LONG: ${input.officeLongitude || 'N/A'} (Allowed Radius: ${input.geofenceRadiusMeters || 500}m)
- Shift Time: ${input.shiftStart || 'N/A'} to ${input.shiftEnd || 'N/A'}
- Allowed IPs: ${input.allowedIps || 'N/A'}
- Recent Check-in Times: ${JSON.stringify(input.recentPunchTimes || [])}
- Heuristic Pre-assessment: ${JSON.stringify(heuristicResult)}

Audit this transaction. Look for:
1. GPS Spoofing: If latitude/longitude is perfectly matching another employee's punch on the same day from different user agents, or if coordinates are spoofed.
2. Buddy Punching: Mismatched browser/OS signatures or duplicate IPs from different employees checked in within seconds.
3. Abnormal Schedules: If the check-in is radically different from the user's historical times.
`;

    const response = await callGroqAiEngine({
      prompt: `${systemPrompt}\n\n${userPrompt}`,
      complexity: 'simple',
      maxTokens: 300,
      temperature: 0.1,
      useCache: false
    });

    if (response.answer) {
      // Find the JSON block if wrapped in markdown
      let rawJson = response.answer.trim();
      const startIdx = rawJson.indexOf('{');
      const endIdx = rawJson.lastIndexOf('}');
      
      if (startIdx !== -1 && endIdx !== -1) {
        rawJson = rawJson.substring(startIdx, endIdx + 1);
      }

      const aiParsed = JSON.parse(rawJson);
      return {
        isAnomaly: aiParsed.isAnomaly ?? heuristicResult.isAnomaly,
        anomalyType: aiParsed.anomalyType ?? heuristicResult.anomalyType,
        confidenceScore: aiParsed.confidenceScore ?? heuristicResult.confidenceScore,
        details: aiParsed.details ?? heuristicResult.details,
        recommendation: aiParsed.recommendation ?? heuristicResult.recommendation,
      };
    }
  } catch (err: any) {
    logger.warn('Failed to run AI anomaly detection, falling back to heuristics:', { error: err.message });
  }

  return heuristicResult;
}
