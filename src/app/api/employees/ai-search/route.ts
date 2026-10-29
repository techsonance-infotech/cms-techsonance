import { NextResponse } from 'next/server';
import { withApiHandler } from '@/server/http/handler';
import { BadRequestError } from '@/server/http/errors';
import { callGroqAiEngine } from '@/server/ai/groq-client';

export const POST = withApiHandler(async (request, context) => {
  const tenantId = context.auth?.user.tenantId;
  if (!tenantId) throw new BadRequestError('Tenant isolation info required');

  const { query } = await request.json();
  if (!query) throw new BadRequestError('query is required');

  const lowerQuery = query.toLowerCase();

  // Simple local keywords parser for super fast fallback
  const fallbackResponse = {
    search: '',
    department: '',
    status: '',
    workMode: ''
  };

  if (lowerQuery.includes('engineering') || lowerQuery.includes('tech') || lowerQuery.includes('develop')) {
    fallbackResponse.department = 'Engineering';
  } else if (lowerQuery.includes('hr') || lowerQuery.includes('human resource') || lowerQuery.includes('recruit')) {
    fallbackResponse.department = 'HR';
  } else if (lowerQuery.includes('finance') || lowerQuery.includes('account')) {
    fallbackResponse.department = 'Finance';
  } else if (lowerQuery.includes('marketing') || lowerQuery.includes('sales')) {
    fallbackResponse.department = 'Marketing';
  }

  if (lowerQuery.includes('active') || lowerQuery.includes('working')) {
    fallbackResponse.status = 'Active';
  } else if (lowerQuery.includes('leave') || lowerQuery.includes('vacation')) {
    fallbackResponse.status = 'On Leave';
  } else if (lowerQuery.includes('notice') || lowerQuery.includes('resigned')) {
    fallbackResponse.status = 'On Notice';
  } else if (lowerQuery.includes('probation')) {
    fallbackResponse.status = 'Probation';
  } else if (lowerQuery.includes('contract') || lowerQuery.includes('temporary')) {
    fallbackResponse.status = 'Contract';
  }

  if (lowerQuery.includes('remote') || lowerQuery.includes('wfh')) {
    fallbackResponse.workMode = 'Remote';
  } else if (lowerQuery.includes('hybrid')) {
    fallbackResponse.workMode = 'Hybrid';
  } else if (lowerQuery.includes('office') || lowerQuery.includes('onsite')) {
    fallbackResponse.workMode = 'Office';
  }

  // Find any specific name in quotes or capitalize names
  const nameMatch = query.match(/["']([^"']+)["']/);
  if (nameMatch) {
    fallbackResponse.search = nameMatch[1];
  } else {
    // If query is short and doesn't match above, treat it as general search term
    const words = query.split(/\s+/);
    if (words.length <= 2 && !fallbackResponse.department && !fallbackResponse.status && !fallbackResponse.workMode) {
      fallbackResponse.search = query;
    }
  }

  // If GROQ is available, use it to refine the search parameters
  if (process.env.GROQ_API_KEY) {
    try {
      const systemPrompt = `You are a search query parser for an employee directory. Given a user query, output a JSON object containing keys: "search" (string or empty), "department" (string or empty), "status" (string: "Active", "On Leave", "On Notice", "Probation", "Contract", or empty), "workMode" (string: "Office", "Hybrid", "Remote", or empty). Return ONLY the raw JSON block without markdown formatting or other explanation.
Examples:
- "active developers in engineering" -> {"search":"", "department":"Engineering", "status":"Active", "workMode":""}
- "people on leave" -> {"search":"", "department":"", "status":"On Leave", "workMode":""}
- "find Kunal" -> {"search":"Kunal", "department":"", "status":"", "workMode":""}
- "remote marketing staff on notice" -> {"search":"", "department":"Marketing", "status":"On Notice", "workMode":"Remote"}`;

      const groqRes = await callGroqAiEngine({
        prompt: `Parse this search query: "${query}"`,
        templateName: 'COPILOT_QUERY',
        templateVariables: {
          userQuery: query,
          slimContext: { systemPrompt }
        },
        complexity: 'simple',
        maxTokens: 100,
        useCache: true
      });

      const parsed = JSON.parse(groqRes.answer.replace(/```json|```/g, '').trim());
      return NextResponse.json({ success: true, data: { ...fallbackResponse, ...parsed } });
    } catch (e) {
      console.error('Groq AI parsing error, using fallback:', e);
    }
  }

  // Fallback to Gemini if available
  const geminiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_AI_KEY;
  if (geminiKey) {
    try {
      const payload = {
        contents: [{
          parts: [{
            text: `You are a search query parser. Parse user query "${query}" to JSON containing keys: "search" (string), "department" (string), "status" ("Active", "On Leave", "On Notice", "Probation", "Contract", or empty), "workMode" ("Office", "Hybrid", "Remote", or empty). Return ONLY the raw JSON object, no markdown.`
          }]
        }]
      };

      const geminiRes = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${geminiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (geminiRes.ok) {
        const resJson = await geminiRes.json();
        const text = resJson?.candidates?.[0]?.content?.parts?.[0]?.text || '';
        const parsed = JSON.parse(text.replace(/```json|```/g, '').trim());
        return NextResponse.json({ success: true, data: { ...fallbackResponse, ...parsed } });
      }
    } catch (e) {
      console.error('Gemini AI parsing error, using fallback:', e);
    }
  }

  return NextResponse.json({ success: true, data: fallbackResponse });
}, { requireAuth: true, roles: ['Employee'] });
