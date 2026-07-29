import { NextResponse } from 'next/server';
import { withApiHandler } from '@/server/http/handler';
import { BadRequestError } from '@/server/http/errors';
import { getAdminRouteSupabase } from '@/server/supabase/route-helpers';

export const GET = withApiHandler(async (request, context) => {
  const tenantId = context.auth?.user.tenantId;
  if (!tenantId) throw new BadRequestError('Tenant context missing');

  const supabase = getAdminRouteSupabase();

  let { data: passes, error } = await supabase
    .from('visitor_passes')
    .select('*, visitors(*), host:host_id(first_name, last_name)')
    .eq('tenant_id', tenantId)
    .order('created_at', { ascending: false });

  if (error) throw error;

  // Insert seed visitor data if empty
  if (!passes || passes.length === 0) {
    // 1. Create a seed visitor
    const visitorEmail = 'rahul.singh@corporate.com';
    let visitorId = '';

    const { data: existingVis } = await supabase
      .from('visitors')
      .select('id')
      .eq('tenant_id', tenantId)
      .eq('email', visitorEmail)
      .maybeSingle();

    if (existingVis) {
      visitorId = existingVis.id;
    } else {
      const { data: newVis } = await supabase
        .from('visitors')
        .insert({
          tenant_id: tenantId,
          full_name: 'Rahul Singh',
          email: visitorEmail,
          phone: '+91 98877 66554',
          company: 'Alpha Tech Solutions'
        })
        .select('id')
        .single();
      if (newVis) visitorId = newVis.id;
    }

    if (visitorId) {
      const seeds = [
        {
          tenant_id: tenantId,
          visitor_id: visitorId,
          host_id: context.auth!.user.id,
          purpose: 'Quarterly Vendor Review Meeting',
          scheduled_start: new Date(Date.now() + 3600000).toISOString(), // In 1 hour
          scheduled_end: new Date(Date.now() + 7200000).toISOString(),
          status: 'Pre-Registered',
          qr_code_token: 'QR-PASS-' + Math.random().toString(36).substring(2, 10).toUpperCase()
        },
        {
          tenant_id: tenantId,
          visitor_id: visitorId,
          host_id: context.auth!.user.id,
          purpose: 'API Integration Discussion',
          scheduled_start: new Date(Date.now() - 86400000).toISOString(), // Yesterday
          scheduled_end: new Date(Date.now() - 82800000).toISOString(),
          status: 'Checked Out',
          qr_code_token: 'QR-PASS-' + Math.random().toString(36).substring(2, 10).toUpperCase(),
          check_in_at: new Date(Date.now() - 86400000).toISOString(),
          check_out_at: new Date(Date.now() - 82800000).toISOString()
        }
      ];

      const { data: inserted, error: insertErr } = await supabase
        .from('visitor_passes')
        .insert(seeds)
        .select('*, visitors(*), host:host_id(first_name, last_name)');

      if (!insertErr && inserted) {
        passes = inserted;
      }
    }
  }

  return NextResponse.json({ success: true, data: passes });
}, { requireAuth: true, roles: ['Employee'] });

export const POST = withApiHandler(async (request, context) => {
  const tenantId = context.auth?.user.tenantId;
  if (!tenantId) throw new BadRequestError('Tenant context missing');

  const body = await request.json();
  const { fullName, email, phone, company, hostId, purpose, scheduledStart, scheduledEnd } = body;

  if (!fullName || !email || !purpose || !scheduledStart || !scheduledEnd) {
    throw new BadRequestError('Missing required visitor parameters');
  }

  const supabase = getAdminRouteSupabase();

  // 1. Create or fetch visitor
  let visitorId = '';
  const { data: existingVis, error: visFindErr } = await supabase
    .from('visitors')
    .select('id')
    .eq('tenant_id', tenantId)
    .eq('email', email)
    .maybeSingle();

  if (existingVis) {
    visitorId = existingVis.id;
  } else {
    const { data: newVis, error: visInsErr } = await supabase
      .from('visitors')
      .insert({
        tenant_id: tenantId,
        full_name: fullName,
        email,
        phone,
        company
      })
      .select('id')
      .single();
    
    if (visInsErr || !newVis) throw new BadRequestError('Failed to register visitor');
    visitorId = newVis.id;
  }

  // 2. Create Pass
  const qrCodeToken = 'QR-PASS-' + Math.random().toString(36).substring(2, 10).toUpperCase();

  const { data: pass, error: passErr } = await supabase
    .from('visitor_passes')
    .insert({
      tenant_id: tenantId,
      visitor_id: visitorId,
      host_id: hostId || context.auth!.user.id,
      purpose,
      scheduled_start: scheduledStart,
      scheduled_end: scheduledEnd,
      status: 'Pre-Registered',
      qr_code_token: qrCodeToken
    })
    .select('*')
    .single();

  if (passErr) throw passErr;

  return NextResponse.json({ success: true, data: pass });
}, { requireAuth: true, roles: ['Employee'] });
