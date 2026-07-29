import { callGroqAiEngine } from '@/server/ai/groq-client';
import { type ComplianceViolation } from './violation-detector';
import { type EmployeeComplianceScore, type DepartmentComplianceScore } from './compliance-engine';

export interface ComplianceRiskSnapshot {
  overallRiskCategory: 'Critical' | 'High' | 'Medium' | 'Low';
  primaryRiskDrivers: string[];
  recommendations: string[];
  confidenceScore: number;
}

export async function generateComplianceRiskAssessment(
  violations: ComplianceViolation[],
  deptScores: DepartmentComplianceScore[]
): Promise<ComplianceRiskSnapshot> {
  const payloadSummary = {
    violationsCount: violations.length,
    criticalViolations: violations.filter(v => v.severity === 'Critical').length,
    highViolations: violations.filter(v => v.severity === 'High').length,
    mediumViolations: violations.filter(v => v.severity === 'Medium').length,
    deptCompliance: deptScores.map(d => `${d.department}: ${d.score}%`)
  };

  const prompt = `
  You are an Enterprise Compliance Auditor and Risk Officer. Analyze the following compliance snapshot:
  ${JSON.stringify(payloadSummary, null, 2)}
  
  Provide a structured JSON risk assessment. Return ONLY a JSON object with this shape:
  {
    "overallRiskCategory": "Critical" | "High" | "Medium" | "Low",
    "primaryRiskDrivers": ["String description of driver 1", "driver 2"],
    "recommendations": ["remediation step 1", "step 2"],
    "confidenceScore": 0.0 to 1.0
  }
  `;

  try {
    const res = await callGroqAiEngine({
      prompt,
      complexity: 'complex',
      maxTokens: 350
    });

    if (res.json) {
      return res.json as unknown as ComplianceRiskSnapshot;
    }
    // Fallback if returned raw json string in answer
    return JSON.parse(res.answer);
  } catch (err) {
    console.error('AI risk assessment error:', err);
    return {
      overallRiskCategory: violations.some(v => v.severity === 'Critical') ? 'High' : 'Medium',
      primaryRiskDrivers: ['Active compliance violations pending review.'],
      recommendations: ['Perform manual inspection of validation logs.', 'Remediate pending CAPA plans.'],
      confidenceScore: 0.7
    };
  }
}

export async function askComplianceCopilot(
  query: string,
  violations: ComplianceViolation[],
  employeeScores: EmployeeComplianceScore[],
  upcomingDeadlines: any[]
): Promise<{ answer: string; confidence: number }> {
  // Prune contextual data payload to strictly fit token caps (retrieval rule)
  const slimViolations = violations.slice(0, 10).map(v => ({
    id: v.id,
    emp: v.employeeName,
    cat: v.category,
    title: v.title,
    severity: v.severity,
    status: v.status
  }));

  const slimScores = employeeScores.slice(0, 10).map(s => ({
    name: s.name,
    score: s.score,
    violations: s.openViolationsCount
  }));

  const contextPrompt = `
  Context data:
  - Active violations: ${JSON.stringify(slimViolations)}
  - Lowest compliance employee scores: ${JSON.stringify(slimScores)}
  - Upcoming deadlines (next 90 days): ${JSON.stringify(upcomingDeadlines.slice(0, 10))}

  User query: "${query}"

  Answer the query concisely using the context data above. If the information isn't in the context, answer using general corporate compliance practices. 
  Return ONLY a JSON response in the following format:
  {
    "answer": "Plain text concise answer.",
    "confidence": 0.0 to 1.0
  }
  `;

  try {
    const res = await callGroqAiEngine({
      prompt: contextPrompt,
      complexity: 'simple',
      maxTokens: 400
    });

    if (res.json) {
      return res.json as unknown as { answer: string; confidence: number };
    }
    return JSON.parse(res.answer);
  } catch (err) {
    console.error('Compliance Copilot answer error:', err);
    return {
      answer: `I could not process the query due to a connection issue. Based on active records, there are ${violations.length} unresolved compliance items requiring attention.`,
      confidence: 0.5
    };
  }
}
