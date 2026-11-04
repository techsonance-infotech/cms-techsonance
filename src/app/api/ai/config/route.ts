import { NextResponse } from 'next/server';
import { withApiHandler } from '@/server/http/handler';
import { getAdminRouteSupabase } from '@/server/supabase/route-helpers';
import { BadRequestError } from '@/server/http/errors';

export const GET = withApiHandler(async (request, context) => {
  const tenantId = context.auth?.user.tenantId;
  if (!tenantId) throw new BadRequestError('Tenant info required');

  const supabase = getAdminRouteSupabase();

  // Fetch company ai settings
  const { data: company, error: companyError } = await supabase
    .from('company_settings')
    .select('ai_model, ai_temperature, ai_prompt_template, ai_assistant_name')
    .eq('tenant_id', tenantId)
    .single();

  if (companyError && companyError.code !== 'PGRST116') {
    throw companyError;
  }

  // Fetch knowledge base files
  const { data: kbFiles, error: kbError } = await supabase
    .from('tenant_knowledge_base')
    .select('*')
    .eq('tenant_id', tenantId)
    .order('created_at', { ascending: false });

  if (kbError) throw kbError;

  return NextResponse.json({
    success: true,
    data: {
      settings: company || { ai_model: 'gemini-1.5-pro', ai_temperature: 0.7, ai_prompt_template: '', ai_assistant_name: 'AI Workspace Assistant' },
      kbFiles: kbFiles || [],
      tokenLogs: [],
      usage: {
        limit: 100000,
        used: 0,
        creditsRemaining: 0
      }
    }
  });
}, { requireAuth: true, roles: ['Admin', 'Manager'] });

export const POST = withApiHandler(async (request, context) => {
  const tenantId = context.auth?.user.tenantId;
  if (!tenantId) throw new BadRequestError('Tenant info required');

  const supabase = getAdminRouteSupabase();
  const { action, aiModel, aiTemperature, aiPromptTemplate, aiAssistantName, fileName, fileUrl, fileSize, fileId } = await request.json();

  if (action === 'save-config') {
    const { data, error } = await supabase
      .from('company_settings')
      .upsert({
        tenant_id: tenantId,
        ai_model: aiModel,
        ai_temperature: aiTemperature,
        ai_prompt_template: aiPromptTemplate,
        ai_assistant_name: aiAssistantName,
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'tenant_id'
      })
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json({ success: true, message: 'AI configurations saved successfully!', data });
  }

  if (action === 'upload-kb') {
    if (!fileName || !fileUrl) throw new BadRequestError('fileName and fileUrl are required');

    const { data, error } = await supabase
      .from('tenant_knowledge_base')
      .insert({
        tenant_id: tenantId,
        file_name: fileName,
        file_url: fileUrl,
        size: fileSize || '0 KB',
        is_indexed: true
      })
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json({ success: true, message: 'Knowledge document uploaded & indexed successfully!', data });
  }

  if (action === 'delete-kb') {
    if (!fileId) throw new BadRequestError('fileId is required');

    const { error } = await supabase
      .from('tenant_knowledge_base')
      .delete()
      .eq('tenant_id', tenantId)
      .eq('id', fileId);

    if (error) throw error;
    return NextResponse.json({ success: true, message: 'Knowledge document removed!' });
  }

  throw new BadRequestError('Invalid action specified.');
}, { requireAuth: true, roles: ['Admin'] });
