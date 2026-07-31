import { NextResponse } from 'next/server';
import { withApiHandler } from '@/server/http/handler';
import { BadRequestError } from '@/server/http/errors';
import { apiSuccess } from '@/server/http/response';
import { callGroqAiEngine } from '@/server/ai/groq-client';

export const POST = withApiHandler(async (request, context) => {
  const tenantId = context.auth?.user.tenantId;
  if (!tenantId) throw new BadRequestError('Tenant context missing');

  const { messages, clientName } = await request.json();

  const conversationHistory = (messages || [])
    .slice(-4)
    .map((m: any) => `${m.sender === 'user' ? 'Me' : clientName || 'Client'}: ${m.text}`)
    .join('\n');

  const systemInstructions = `You are a sales assistant helping reply to client inquiries.
Review the conversation history, and generate exactly TWO quick-reply option suggestions.
Respond ONLY with a valid JSON array of strings, for example:
[
  "Yes, that time works perfectly.",
  "I will get our engineering team to review this requirement."
]
Keep suggestions short, professional, and directly relevant to the client's last message. Do not add markdown formatting or text outside the JSON.`;

  let jsonResult: string[] = [];

  // Priority 1: Groq AI
  if (process.env.GROQ_API_KEY && conversationHistory) {
    try {
      const groqRes = await callGroqAiEngine({
        prompt: `${systemInstructions}\n\nHistory:\n${conversationHistory}\n\nSuggested Replies JSON:`,
        useCache: true,
      });
      if (groqRes && groqRes.answer) {
        const rawText = groqRes.answer.trim();
        const jsonStr = rawText.substring(rawText.indexOf('['), rawText.lastIndexOf(']') + 1);
        jsonResult = JSON.parse(jsonStr);
      }
    } catch (e) {
      console.warn('Groq failed in reply generator:', e);
    }
  }

  // Priority 2: Gemini AI
  const geminiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_AI_KEY;
  if (jsonResult.length === 0 && geminiKey && conversationHistory) {
    try {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${geminiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [
              { parts: [{ text: `${systemInstructions}\n\nHistory:\n${conversationHistory}\n\nSuggested Replies JSON:` }] }
            ],
          }),
        }
      );
      if (response.ok) {
        const data = await response.json();
        const rawText = data?.candidates?.[0]?.content?.parts?.[0]?.text || '';
        const jsonStr = rawText.substring(rawText.indexOf('['), rawText.lastIndexOf(']') + 1);
        jsonResult = JSON.parse(jsonStr);
      }
    } catch (e) {
      console.warn('Gemini failed in reply generator:', e);
    }
  }

  // Fallbacks if LLM fails or history is empty
  if (jsonResult.length === 0) {
    jsonResult = [
      `Hi ${clientName || 'there'}, thanks for reaching out. Let's schedule a call.`,
      `I will review the specifications and get back to you shortly.`
    ];
  }

  return apiSuccess(jsonResult);
}, { requireAuth: true, roles: ['Employee'] });
