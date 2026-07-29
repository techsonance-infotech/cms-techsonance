import { NextResponse } from 'next/server';
import { withApiHandler } from '@/server/http/handler';
import { BadRequestError, ForbiddenError } from '@/server/http/errors';
import { getAdminRouteSupabase } from '@/server/supabase/route-helpers';

export const GET = withApiHandler(async (request, context) => {
  const user = context.auth!.user;
  const tenantId = user.tenantId;

  if (!tenantId) throw new BadRequestError('Tenant ID missing');

  const supabase = getAdminRouteSupabase();

  try {
    const { data: dbFindings } = await supabase
      .from('compliance_audit_findings')
      .select('*')
      .eq('tenant_id', tenantId)
      .order('created_at', { ascending: false });

    const findings = (dbFindings || []).map((f: any) => ({
      id: f.id,
      findingCode: f.finding_code || `AUDIT-${f.id.slice(0, 8)}`,
      category: f.category,
      severity: f.severity || 'Medium',
      description: f.description,
      status: f.status || 'Open',
      capaPlan: f.corrective_action_plan || '',
      dueDate: f.due_date
    }));

    return NextResponse.json({ success: true, findings });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}, { requireAuth: true });

export const POST = withApiHandler(async (request, context) => {
  const payload = await request.json();
  const { category, severity, description, dueDate, capaPlan } = payload;

  const user = context.auth!.user;
  const tenantId = user.tenantId;

  if (!tenantId) throw new BadRequestError('Tenant ID missing');

  const userRole = (user.role || '').toLowerCase().replace(/[^a-z0-9_]/g, '');
  const canApprove = ['admin', 'hr_manager', 'project_manager'].includes(userRole);

  if (!canApprove) {
    throw new ForbiddenError('Insufficient permissions. Creating findings/violations requires Manager access.');
  }

  if (!category || !description) {
    throw new BadRequestError('Category and Description are required');
  }

  const supabase = getAdminRouteSupabase();
  const findingCode = `AUDIT-${Math.floor(1000 + Math.random() * 9000)}`;

  try {
    const { data, error } = await supabase
      .from('compliance_audit_findings')
      .insert({
        tenant_id: tenantId,
        finding_code: findingCode,
        category,
        severity: severity || 'Medium',
        description: description.trim(),
        status: 'Open',
        corrective_action_plan: capaPlan ? capaPlan.trim() : null,
        due_date: dueDate || new Date(Date.now() + 86400000 * 14).toISOString(),
        created_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({
      success: true,
      message: 'Compliance finding logged successfully',
      finding: data
    }, { status: 201 });
  } catch (err: any) {
    throw new BadRequestError(err.message || 'Failed to log compliance finding');
  }
}, { requireAuth: true });
