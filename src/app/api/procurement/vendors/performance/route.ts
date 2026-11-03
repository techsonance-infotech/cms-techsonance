import { NextResponse } from 'next/server';
import { withApiHandler } from '@/server/http/handler';
import { BadRequestError } from '@/server/http/errors';
import { getAdminRouteSupabase, resolveActorUuid } from '@/server/supabase/route-helpers';

export const GET = withApiHandler(async (request, context) => {
  const tenantId = context.auth?.user.tenantId;
  if (!tenantId) throw new BadRequestError('Tenant context missing');

  const { searchParams } = new URL(request.url);
  const vendorId = searchParams.get('vendorId');

  if (!vendorId) {
    throw new BadRequestError('Missing vendorId parameter');
  }

  const supabase = getAdminRouteSupabase();

  let { data: reviews, error } = await supabase
    .from('psa_vendor_performance')
    .select('*, reviewer:reviewed_by(first_name, last_name)')
    .eq('tenant_id', tenantId)
    .eq('vendor_id', vendorId)
    .order('created_at', { ascending: false });

  if (error) throw error;

  // Auto-seed sample review if empty
  if (!reviews || reviews.length === 0) {
    const reviewerUuid = await resolveActorUuid(context, supabase);
    const seeds = [
      {
        tenant_id: tenantId,
        vendor_id: vendorId,
        reviewed_by: reviewerUuid,
        sla_score: 5,
        quality_score: 4,
        communication_score: 4,
        remarks: 'HP Enterprise resolved infrastructure setups strictly within PMO limits. High-quality support.'
      }
    ];

    const { data: inserted, error: insertErr } = await supabase
      .from('psa_vendor_performance')
      .insert(seeds)
      .select('*, reviewer:reviewed_by(first_name, last_name)');

    if (!insertErr && inserted) {
      reviews = inserted;
    }
  }

  return NextResponse.json({ success: true, data: reviews });
}, { requireAuth: true, roles: ['Employee'] });

export const POST = withApiHandler(async (request, context) => {
  const tenantId = context.auth?.user.tenantId;
  if (!tenantId) throw new BadRequestError('Tenant context missing');

  const body = await request.json();
  const { vendorId, slaScore, qualityScore, communicationScore, remarks } = body;

  if (!vendorId || !slaScore || !qualityScore || !communicationScore) {
    throw new BadRequestError('Missing required rating parameters');
  }

  const supabase = getAdminRouteSupabase();
  const reviewerUuid = await resolveActorUuid(context, supabase);

  const { data, error } = await supabase
    .from('psa_vendor_performance')
    .insert({
      tenant_id: tenantId,
      vendor_id: vendorId,
      reviewed_by: reviewerUuid,
      sla_score: parseInt(slaScore),
      quality_score: parseInt(qualityScore),
      communication_score: parseInt(communicationScore),
      remarks
    })
    .select('*')
    .single();

  if (error) throw error;
  return NextResponse.json({ success: true, data });
}, { requireAuth: true, roles: ['Employee'] });
