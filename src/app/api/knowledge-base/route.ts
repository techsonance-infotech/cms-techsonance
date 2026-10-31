import { NextResponse } from 'next/server';
import { withApiHandler } from '@/server/http/handler';
import { BadRequestError } from '@/server/http/errors';
import { getAdminRouteSupabase } from '@/server/supabase/route-helpers';
import { logger } from '@/server/logging/logger';

// Helper to validate UUID string
const isValidUuid = (val: unknown): val is string =>
  typeof val === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(val);

function resolveAuthUserUuid(context: any): string | null {
  const user = context.auth?.user;
  if (!user) return null;
  if (isValidUuid(user.providerUserId)) return user.providerUserId;
  if (isValidUuid(context.auth?.tokenId)) return context.auth.tokenId;
  if (isValidUuid(context.auth?.sessionId)) return context.auth.sessionId;
  return null;
}

export const GET = withApiHandler(async (request, context) => {
  const tenantId = context.auth?.user.tenantId;
  if (!tenantId) throw new BadRequestError('Tenant context missing');

  const supabase = getAdminRouteSupabase();

  let { data: docs, error } = await supabase
    .from('knowledge_documents')
    .select('*, created_by(first_name, last_name)')
    .eq('tenant_id', tenantId)
    .order('updated_at', { ascending: false });

  if (error) throw error;

  // Seeding default templates if database is fresh
  if (!docs || docs.length === 0) {
    const userUuid = resolveAuthUserUuid(context);
    const seeds = [
      {
        tenant_id: tenantId,
        title: 'Information Security & Acceptable Use Policy',
        content: 'This document defines standard IT hygiene protocols. Employees must configure 2FA on all corporate credentials, lock workstations when away, and refrain from storing unencrypted client metadata on local drives.',
        type: 'Policy',
        category: 'Security',
        version: 1,
        created_by: userUuid
      },
      {
        tenant_id: tenantId,
        title: 'SOP: Git Branching & Next.js Code Releasing',
        content: '1. Create branch from main following syntax: feature/issue-id.\n2. Submit PR detailing all visual adjustments.\n3. Verify compilation checks with npm run typecheck.\n4. Merge requires approval from Lead Architect.',
        type: 'SOP',
        category: 'Tech',
        version: 1,
        created_by: userUuid
      },
      {
        tenant_id: tenantId,
        title: 'Q: How to claim medical expense reimbursements?',
        content: 'Medical expense claims must be logged under the Reimbursements dashboard before the 25th of the active month. Employees must attach digital invoice receipts. Reimbursements are settled in the subsequent payroll run.',
        type: 'FAQ',
        category: 'HR',
        version: 1,
        created_by: userUuid
      },
      {
        tenant_id: tenantId,
        title: 'Corporate Q3 Office Outage Announcement',
        content: 'Please note that the primary office server node will undergo diagnostic maintenance on Sunday, August 10, between 09:00 AM and 04:00 PM. VPN connectivity will be temporarily interrupted.',
        type: 'Announcement',
        category: 'Operations',
        version: 1,
        created_by: userUuid
      }
    ];

    const { data: inserted, error: insertErr } = await supabase
      .from('knowledge_documents')
      .insert(seeds)
      .select('*, created_by(first_name, last_name)');

    if (!insertErr && inserted) {
      docs = inserted;
    }
  }

  return NextResponse.json({ success: true, data: docs });
}, { requireAuth: true, roles: ['Employee'] });

export const POST = withApiHandler(async (request, context) => {
  const tenantId = context.auth?.user.tenantId;
  if (!tenantId) throw new BadRequestError('Tenant context missing');

  const body = await request.json();
  const { title, content, type, category } = body;

  if (!title || !content || !type) {
    throw new BadRequestError('Missing title, content, or type');
  }

  const userUuid = resolveAuthUserUuid(context);
  const supabase = getAdminRouteSupabase();

  const { data, error } = await supabase
    .from('knowledge_documents')
    .insert({
      tenant_id: tenantId,
      title: title.trim(),
      content: content.trim(),
      type,
      category: category || 'General',
      version: 1,
      created_by: userUuid
    })
    .select('*')
    .single();

  if (error) {
    logger.error('Failed to insert knowledge document', { error });
    throw new BadRequestError(error.message || 'Failed to publish knowledge document');
  }

  // Insert initial version audit log
  try {
    await supabase
      .from('knowledge_document_versions')
      .insert({
        tenant_id: tenantId,
        document_id: data.id,
        version: 1,
        title: data.title,
        content: data.content,
        changed_by: userUuid,
        change_summary: 'Initial document publication'
      });
  } catch (verErr) {
    console.warn('Initial document version log notice:', verErr);
  }

  return NextResponse.json({ success: true, data }, { status: 201 });
}, { requireAuth: true, roles: ['Employee'] });

export const PUT = withApiHandler(async (request, context) => {
  const tenantId = context.auth?.user.tenantId;
  if (!tenantId) throw new BadRequestError('Tenant context missing');

  const body = await request.json();
  const { docId, title, content, category, changeSummary } = body;

  if (!docId || !title || !content) {
    throw new BadRequestError('Missing docId, title, or content');
  }

  const supabase = getAdminRouteSupabase();

  // 1. Fetch current document to read current version count
  const { data: currentDoc, error: fetchErr } = await supabase
    .from('knowledge_documents')
    .select('version')
    .eq('id', docId)
    .eq('tenant_id', tenantId)
    .single();

  if (fetchErr || !currentDoc) {
    throw new BadRequestError('Document not found');
  }

  const nextVersion = (currentDoc.version || 1) + 1;
  const userUuid = resolveAuthUserUuid(context);

  // 2. Update document
  const { data, error } = await supabase
    .from('knowledge_documents')
    .update({
      title: title.trim(),
      content: content.trim(),
      category: category || 'General',
      version: nextVersion,
      updated_at: new Date().toISOString()
    })
    .eq('id', docId)
    .eq('tenant_id', tenantId)
    .select('*')
    .single();

  if (error) {
    logger.error('Failed to update knowledge document', { error });
    throw new BadRequestError(error.message || 'Failed to update document');
  }

  // 3. Log version history
  try {
    await supabase
      .from('knowledge_document_versions')
      .insert({
        tenant_id: tenantId,
        document_id: docId,
        version: nextVersion,
        title: data.title,
        content: data.content,
        changed_by: userUuid,
        change_summary: changeSummary || `Updated to version ${nextVersion}`
      });
  } catch (verErr) {
    console.warn('Document version log notice:', verErr);
  }

  return NextResponse.json({ success: true, data });
}, { requireAuth: true, roles: ['Employee'] });

export const DELETE = withApiHandler(async (request, context) => {
  const tenantId = context.auth?.user.tenantId;
  if (!tenantId) throw new BadRequestError('Tenant context missing');

  const { searchParams } = new URL(request.url);
  const docId = searchParams.get('id') || searchParams.get('docId');

  if (!docId) throw new BadRequestError('Document ID is required');

  const supabase = getAdminRouteSupabase();

  // Remove versions first
  await supabase
    .from('knowledge_document_versions')
    .delete()
    .eq('document_id', docId)
    .eq('tenant_id', tenantId);

  const { error } = await supabase
    .from('knowledge_documents')
    .delete()
    .eq('id', docId)
    .eq('tenant_id', tenantId);

  if (error) {
    logger.error('Failed to delete knowledge document', { error });
    throw new BadRequestError(error.message || 'Failed to delete document');
  }

  return NextResponse.json({ success: true, message: 'Document deleted successfully' });
}, { requireAuth: true, roles: ['Employee'] });
