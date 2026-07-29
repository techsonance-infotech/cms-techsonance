import { NextResponse } from 'next/server';
import { withApiHandler } from '@/server/http/handler';
import { BadRequestError } from '@/server/http/errors';
import { getAdminRouteSupabase } from '@/server/supabase/route-helpers';

// GET: fetch risks for a specific project
export const GET = withApiHandler(async (request, context) => {
  const searchParams = new URL(request.url).searchParams;
  const projectId = searchParams.get('projectId');
  if (!projectId) {
    throw new BadRequestError('projectId parameter is required');
  }

  const tenantId = context.auth?.user.tenantId;
  if (!tenantId) throw new BadRequestError('Tenant context required');

  const supabase = getAdminRouteSupabase();

  const { data, error } = await supabase
    .from('project_risks_issues')
    .select('*')
    .eq('tenant_id', tenantId)
    .eq('project_id', parseInt(projectId, 10))
    .order('created_at', { ascending: false });

  if (error) {
    throw error;
  }

  return NextResponse.json({ success: true, data });
}, { requireAuth: true, roles: ['Employee'] });

// POST: create a new risk/issue
export const POST = withApiHandler(async (request, context) => {
  const body = await request.json();
  const { projectId, title, type, impact, probability, mitigation, status } = body;
  if (!projectId || !title) {
    throw new BadRequestError('projectId and title are required fields');
  }

  const tenantId = context.auth?.user.tenantId;
  if (!tenantId) throw new BadRequestError('Tenant context required');

  const supabase = getAdminRouteSupabase();

  const { data, error } = await supabase
    .from('project_risks_issues')
    .insert({
      tenant_id: tenantId,
      project_id: parseInt(projectId, 10),
      title,
      type: type || 'Risk',
      impact: impact || 'Medium',
      probability: probability || 'Medium',
      mitigation: mitigation || null,
      status: status || 'Open'
    })
    .select()
    .single();

  if (error) {
    throw error;
  }

  return NextResponse.json({ success: true, data });
}, { requireAuth: true, roles: ['Employee'] });

// PATCH: update status / mitigation
export const PATCH = withApiHandler(async (request, context) => {
  const searchParams = new URL(request.url).searchParams;
  const id = searchParams.get('id');
  if (!id) {
    throw new BadRequestError('id parameter is required');
  }

  const tenantId = context.auth?.user.tenantId;
  if (!tenantId) throw new BadRequestError('Tenant context required');

  const body = await request.json();
  const { mitigation, status } = body;

  const supabase = getAdminRouteSupabase();

  const { data, error } = await supabase
    .from('project_risks_issues')
    .update({
      mitigation,
      status
    })
    .eq('tenant_id', tenantId)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    throw error;
  }

  return NextResponse.json({ success: true, data });
}, { requireAuth: true, roles: ['Employee'] });
