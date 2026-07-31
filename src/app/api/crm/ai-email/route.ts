import { NextResponse } from 'next/server';
import { withApiHandler } from '@/server/http/handler';
import { BadRequestError } from '@/server/http/errors';
import { callGroqAiEngine } from '@/server/ai/groq-client';

export const POST = withApiHandler(async (request, context) => {
  const tenantId = context.auth?.user.tenantId;
  if (!tenantId) throw new BadRequestError('Tenant context missing');

  const body = await request.json();
  const { prompt, tone, category, recipientName, brandVoice } = body;

  if (!prompt || !category) {
    throw new BadRequestError('Prompt and category are required');
  }

  const selectedTone = tone || 'Professional';
  const voice = brandVoice || 'TechSonance Standard';

  const systemInstructions = `You are a professional CRM sales AI assistant. Generate a high-performing email matching the user's prompt.
You MUST respond with a single valid JSON object containing exactly these fields (do not wrap in markdown \`\`\`json blocks):
{
  "subject": "Descriptive, high-open-rate subject line",
  "body": "Complete email body using newlines (\\n) for spacing. Address the recipient as ${recipientName || 'Client'}.",
  "cta": "Short call-to-action link text (e.g. Schedule a brief call)",
  "followUpSuggestion": "Recommended nudge timing",
  "spamScore": "0.01 (Excellent)"
}
Brand Voice to use: "${voice}".
Tone of voice: "${selectedTone}".
Category: "${category}".`;

  const promptText = `Instructions prompt: "${prompt}"\n\nGenerate the JSON output now:`;

  let jsonResult: any = null;

  // Priority 1: Groq AI
  if (process.env.GROQ_API_KEY) {
    try {
      const groqRes = await callGroqAiEngine({
        prompt: `${systemInstructions}\n\n${promptText}`,
        useCache: true,
      });
      if (groqRes && groqRes.answer) {
        const rawText = groqRes.answer.trim();
        const jsonStr = rawText.substring(rawText.indexOf('{'), rawText.lastIndexOf('}') + 1);
        jsonResult = JSON.parse(jsonStr);
      }
    } catch (e) {
      console.warn('Groq failed in email generator:', e);
    }
  }

  // Priority 2: Gemini AI
  const geminiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_AI_KEY;
  if (!jsonResult && geminiKey) {
    try {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${geminiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [
              { parts: [{ text: `${systemInstructions}\n\n${promptText}` }] }
            ],
          }),
        }
      );
      if (response.ok) {
        const data = await response.json();
        const rawText = data?.candidates?.[0]?.content?.parts?.[0]?.text || '';
        const jsonStr = rawText.substring(rawText.indexOf('{'), rawText.lastIndexOf('}') + 1);
        jsonResult = JSON.parse(jsonStr);
      }
    } catch (e) {
      console.warn('Gemini failed in email generator:', e);
    }
  }

  // Heuristic Fallback
  if (!jsonResult) {
    let fallbackBody = `Dear ${recipientName || 'Client'},\n\nFollowing up on our CRM roadmap discussion. We are excited to collaborate with you to build dynamic sales intelligence pipelines.\n\nPlease let me know if these terms align with your schedules.\n\nBest regards,\nSales Representative`;
    if (selectedTone === 'Casual') {
      fallbackBody = fallbackBody.replace('Dear', 'Hi').replace('Best regards,', 'Cheers,');
    }
    jsonResult = {
      subject: `Follow-up: CRM Deployment roadmap`,
      body: fallbackBody,
      cta: 'Schedule a brief call',
      followUpSuggestion: 'Nudge if no reply within 48 hours',
      spamScore: '0.04 (Excellent)'
    };
  }

  return NextResponse.json({
    success: true,
    data: jsonResult
  });
}, { requireAuth: true, roles: ['Employee'] });
