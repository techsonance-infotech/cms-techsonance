import { NextResponse } from 'next/server';
import { withApiHandler } from '@/server/http/handler';
import { BadRequestError } from '@/server/http/errors';
import { apiSuccess } from '@/server/http/response';
import { callGroqAiEngine } from '@/server/ai/groq-client';

export const POST = withApiHandler(async (request, context) => {
  const tenantId = context.auth?.user.tenantId;
  if (!tenantId) throw new BadRequestError('Tenant context missing');

  const { messages, clientName, targetLanguage } = await request.json();

  const conversationHistory = (messages || [])
    .map((m: any) => `${m.sender === 'user' ? 'Me' : clientName || 'Client'}: ${m.text}`)
    .join('\n');

  const systemInstructions = `You are an AI sales intelligence copilot. Analyze this conversation history.
You MUST output exactly a single valid JSON object containing these keys (do not add formatting markdown blocks like \`\`\`json):
{
  "summary": "A concise 2-sentence overview summarizing the client's needs and current discussion status.",
  "sentiment": "positive" | "neutral" | "negative",
  "priority": "high" | "medium" | "low",
  "actionItems": ["Action item string 1", "Action item string 2"],
  "translatedText": "If targetLanguage is provided, translate the last client message into that language. Otherwise, return empty string."
}
Target Language: "${targetLanguage || ''}"`;

  let jsonResult: any = null;

  // Priority 1: Groq AI
  if (process.env.GROQ_API_KEY && conversationHistory) {
    try {
      const groqRes = await callGroqAiEngine({
        prompt: `${systemInstructions}\n\nConversation History:\n${conversationHistory}\n\nJSON Output:`,
        useCache: true,
      });
      if (groqRes && groqRes.answer) {
        const rawText = groqRes.answer.trim();
        const jsonStr = rawText.substring(rawText.indexOf('{'), rawText.lastIndexOf('}') + 1);
        jsonResult = JSON.parse(jsonStr);
      }
    } catch (e) {
      console.warn('Groq copilot failed:', e);
    }
  }

  // Priority 2: Gemini AI
  const geminiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_AI_KEY;
  if (!jsonResult && geminiKey && conversationHistory) {
    try {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${geminiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [
              { parts: [{ text: `${systemInstructions}\n\nConversation History:\n${conversationHistory}\n\nJSON Output:` }] }
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
      console.warn('Gemini copilot failed:', e);
    }
  }

  // Fallbacks if LLM fails
  if (!jsonResult) {
    jsonResult = {
      summary: `Discussion with ${clientName || 'Client'} regarding product SOW parameters.`,
      sentiment: 'neutral',
      priority: 'medium',
      actionItems: [
        'Schedule calendar alignment call tomorrow',
        'Verify technical specification details'
      ],
      translatedText: ''
    };
  }

  return apiSuccess(jsonResult);
}, { requireAuth: true, roles: ['Employee'] });
