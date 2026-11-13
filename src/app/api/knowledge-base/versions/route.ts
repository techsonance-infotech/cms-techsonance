import { NextResponse } from 'next/server';
import { withApiHandler } from '@/server/http/handler';
import { BadRequestError } from '@/server/http/errors';
import { getAdminRouteSupabase } from '@/server/supabase/route-helpers';

export const GET = withApiHandler(async (request, context) => {
  const tenantId = context.auth?.user.tenantId;
  if (!tenantId) throw new BadRequestError('Tenant context missing');

  const { searchParams } = new URL(request.url);
  const docId = searchParams.get('docId');

  if (!docId) {
    throw new BadRequestError('Missing docId parameter');
  }

  const supabase = getAdminRouteSupabase();

  const { data: versions, error } = await supabase
    .from('knowledge_document_versions')
    .select('*, changed_by(first_name, last_name)')
    .eq('tenant_id', tenantId)
    .eq('document_id', docId)
    .order('version', { ascending: false });

  if (error) throw error;

  return NextResponse.json({ success: true, data: versions });
}, { requireAuth: true, roles: ['Manager'] });
