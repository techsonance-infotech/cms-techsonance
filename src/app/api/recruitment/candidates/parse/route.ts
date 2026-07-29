import { NextResponse } from 'next/server';
import { withApiHandler } from '@/server/http/handler';
import { BadRequestError } from '@/server/http/errors';
import { getAdminRouteSupabase } from '@/server/supabase/route-helpers';
import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs';
import path from 'path';

const execPromise = promisify(exec);

// Gemini API Key config
const GEMINI_API_KEY = process.env.GEMINI_API_KEY || process.env.GOOGLE_AI_KEY || process.env.NEXT_PUBLIC_GEMINI_API_KEY;

export const POST = withApiHandler(async (request, context) => {
  const tenantId = context.auth?.user.tenantId;
  if (!tenantId) throw new BadRequestError('Tenant context missing');

  // Parse Multipart Form
  const formData = await request.formData();
  const file = formData.get('file') as File | null;

  if (!file) {
    throw new BadRequestError('No file uploaded');
  }

  // Ensure temp folder exists in workspace
  const tempDir = path.join(process.cwd(), 'src/app/api/recruitment/candidates/parse/temp_uploads');
  if (!fs.existsSync(tempDir)) {
    fs.mkdirSync(tempDir, { recursive: true });
  }

  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);
  const tempFilePath = path.join(tempDir, `${Date.now()}_${file.name}`);
  fs.writeFileSync(tempFilePath, buffer);
  let extractedText = '';
  let pythonSuccess = false;

  // 1. Try local Python Text Extractor script
  try {
    const pythonScriptPath = path.join(process.cwd(), 'scripts/parse_resume.py');
    const { stdout } = await execPromise(`python3 "${pythonScriptPath}" "${tempFilePath}"`);
    const result = JSON.parse(stdout);
    if (result.success && result.text) {
      extractedText = result.text;
      pythonSuccess = true;
    }
  } catch (err) {
    console.warn('Python resume extractor failed, falling back to direct base64 LLM OCR:', err);
  }

  // 2. Transmit to Gemini 2.5 Flash for JSON Extraction
  let parsedCandidate: any = null;
  let ocrUsed = !pythonSuccess;

  if (!GEMINI_API_KEY) {
    // Delete temp file
    if (fs.existsSync(tempFilePath)) fs.unlinkSync(tempFilePath);
    throw new BadRequestError('GEMINI_API_KEY is not configured in workspace environment');
  }

  try {
    let geminiPayload: any = {};

    if (pythonSuccess && extractedText.trim().length > 50) {
      // Send extracted text to Gemini
      geminiPayload = {
        contents: [{
          parts: [{
            text: `Extract the candidate profile fields from this resume text. Return ONLY a valid JSON. Do not write markdown code blocks or backticks.

Fields:
- firstName
- lastName
- email
- phone
- address
- skills (string array)
- experience (array of objects with company, title, duration)
- companies (string array)
- education (array of objects with degree, school, year)
- certifications (string array)
- projects (array of objects with title, description)
- linkedin
- github
- noticePeriod
- currentSalary (numeric)
- expectedSalary (numeric)

Resume Text:
${extractedText}`
          }]
        }],
        generationConfig: {
          responseMimeType: 'application/json'
        }
      };
    } else {
      // Scanned PDF / OCR fallback: Send base64 file content directly to Gemini
      const fileBase64 = buffer.toString('base64');
      geminiPayload = {
        contents: [{
          parts: [
            {
              inlineData: {
                mimeType: file.type || 'application/pdf',
                data: fileBase64
              }
            },
            {
              text: `Extract the candidate profile fields from this resume document file. Return ONLY a valid JSON. Do not write markdown code blocks or backticks.

Fields:
- firstName
- lastName
- email
- phone
- address
- skills (string array)
- experience (array of objects with company, title, duration)
- companies (string array)
- education (array of objects with degree, school, year)
- certifications (string array)
- projects (array of objects with title, description)
- linkedin
- github
- noticePeriod
- currentSalary (numeric)
- expectedSalary (numeric)`
            }
          ]
        }],
        generationConfig: {
          responseMimeType: 'application/json'
        }
      };
      ocrUsed = true;
    }

    const geminiRes = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(geminiPayload)
    });

    if (geminiRes.ok) {
      const data = await geminiRes.json();
      const rawText = data?.candidates?.[0]?.content?.parts?.[0]?.text || '{}';
      parsedCandidate = JSON.parse(rawText);
    } else {
      const errorText = await geminiRes.text();
      console.error('Gemini API call failed:', errorText);
    }
  } catch (err) {
    console.error('Failed to parse candidate via Gemini:', err);
  } finally {
    // Safely delete temporary upload file
    if (fs.existsSync(tempFilePath)) {
      fs.unlinkSync(tempFilePath);
    }
  }

  if (!parsedCandidate) {
    throw new BadRequestError('Failed to parse resume content via LLM parser');
  }

  // 3. Duplicate Candidate Detection
  const supabase = getAdminRouteSupabase();
  let duplicateCandidate: any = null;
  let isDuplicate = false;
  let duplicateType: 'direct' | 'semantic' | null = null;
  let similarityScore = 0;

  const checkEmail = parsedCandidate.email?.trim() || '';
  const checkPhone = parsedCandidate.phone?.trim() || '';
  const checkLinkedin = parsedCandidate.linkedin?.trim() || '';
  const checkGithub = parsedCandidate.github?.trim() || '';

  // Direct Match Query
  if (checkEmail || checkPhone || checkLinkedin || checkGithub) {
    let query = supabase.from('candidate_profiles').select('*').eq('tenant_id', tenantId);
    
    const filters: string[] = [];
    if (checkEmail) filters.push(`email.eq.${checkEmail}`);
    if (checkPhone) filters.push(`phone.eq.${checkPhone}`);
    if (checkLinkedin) filters.push(`linkedin.eq.${checkLinkedin}`);
    if (checkGithub) filters.push(`github.eq.${checkGithub}`);

    if (filters.length > 0) {
      const { data: directMatches } = await query.or(filters.join(','));
      if (directMatches && directMatches.length > 0) {
        duplicateCandidate = directMatches[0];
        isDuplicate = true;
        duplicateType = 'direct';
      }
    }
  }

  // 4. Semantic Similarity Match (pgvector)
  if (!isDuplicate) {
    try {
      const searchContent = `${parsedCandidate.firstName} ${parsedCandidate.lastName} skills: ${(parsedCandidate.skills || []).join(', ')} experience: ${JSON.stringify(parsedCandidate.experience || [])}`;
      
      // Generate embedding vector using Gemini
      const embedRes = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/text-embedding-004:embedContent?key=${GEMINI_API_KEY}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'models/text-embedding-004',
          content: {
            parts: [{ text: searchContent }]
          }
        })
      });

      if (embedRes.ok) {
        const embedData = await embedRes.json();
        const embeddingVector = embedData?.embedding?.values;

        if (embeddingVector && embeddingVector.length === 768) {
          // Query semantic duplicate using match_candidate_resumes RPC function
          const { data: semMatches } = await supabase.rpc('match_candidate_resumes', {
            query_embedding: embeddingVector,
            match_threshold: 0.85,
            match_count: 1,
            target_tenant_id: tenantId
          });

          if (semMatches && semMatches.length > 0) {
            const bestMatch = semMatches[0];
            const { data: fullProfile } = await supabase
              .from('candidate_profiles')
              .select('*')
              .eq('id', bestMatch.id)
              .single();

            if (fullProfile) {
              duplicateCandidate = fullProfile;
              isDuplicate = true;
              duplicateType = 'semantic';
              similarityScore = bestMatch.similarity;
            }
          }
        }
      }
    } catch (vectorErr) {
      console.warn('pgvector semantic match failed (likely extension missing or function not compiled):', vectorErr);
    }
  }

  return NextResponse.json({
    success: true,
    data: {
      parsedProfile: parsedCandidate,
      ocrUsed,
      duplicateCheck: {
        isDuplicate,
        duplicateType,
        similarityScore,
        matchingCandidate: duplicateCandidate ? {
          id: duplicateCandidate.id,
          firstName: duplicateCandidate.first_name,
          lastName: duplicateCandidate.last_name,
          email: duplicateCandidate.email,
          phone: duplicateCandidate.phone,
          status: duplicateCandidate.status
        } : null
      }
    }
  });
}, { requireAuth: true, roles: ['Employee'] });
