import { NextRequest } from 'next/server';
import { withApiHandler } from '@/server/http/handler';
import { BadRequestError, NotFoundError } from '@/server/http/errors';
import { apiSuccess } from '@/server/http/response';
import { getAdminRouteSupabase } from '@/server/supabase/route-helpers';

// Helper to normalize tenant subscription row
function normalizeSubscription(row: Record<string, any>) {
  return {
    id: row.id,
    planCode: row.plan_code,
    planName: row.plan_name,
    status: row.status,
    priceAmount: Number(row.price_amount),
    currency: row.currency,
    billingInterval: row.billing_interval,
    seatsLimit: Number(row.seats_limit),
    seatsUsed: Number(row.seats_used),
    storageLimitGb: Number(row.storage_limit_gb),
    storageUsedGb: Number(row.storage_used_gb),
    currentPeriodStart: row.current_period_start,
    currentPeriodEnd: row.current_period_end,
    cancelAtPeriodEnd: Boolean(row.cancel_at_period_end),
    paymentMethodBrand: row.payment_method_brand || null,
    paymentMethodLast4: row.payment_method_last4 || null,
    appliedCoupon: row.applied_coupon || null,
    taxId: row.tax_id || null,
    billingAddress: row.billing_address || {},
    addons: row.addons || [],
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

// GET: Load billing details (subscription details, seats count, invoices, billing configs)
export const GET = withApiHandler(async (_request, context) => {
  const tenantId = context.auth?.user.tenantId;
  if (!tenantId) throw new BadRequestError('Tenant ID is required');

  const supabase = getAdminRouteSupabase();

  // 1. Fetch current subscription details
  let { data: subscription, error: subError } = await supabase
    .from('tenant_subscriptions')
    .select('*')
    .eq('tenant_id', tenantId)
    .maybeSingle();

  // Create initial trial subscription if it doesn't exist
  if (!subscription) {
    const defaultSub = {
      tenant_id: tenantId,
      plan_code: 'free',
      plan_name: 'Free Trial',
      status: 'active',
      price_amount: 0.00,
      currency: 'INR',
      billing_interval: 'monthly',
      seats_limit: 10,
      seats_used: 1,
      storage_limit_gb: 5.00,
      storage_used_gb: 0.25,
      current_period_start: new Date().toISOString(),
      current_period_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      cancel_at_period_end: false,
    };

    const { data: inserted, error: insertError } = await supabase
      .from('tenant_subscriptions')
      .insert(defaultSub)
      .select('*')
      .single();

    if (insertError) {
      console.warn('Fallback: Failed to insert tenant subscription in DB, using mock', insertError.message);
      subscription = { ...defaultSub, id: 'temp-sub-id' };
    } else {
      subscription = inserted;
    }
  }

  // 2. Fetch active seat count from public.users table
  const { count: usersCount, error: countErr } = await supabase
    .from('users')
    .select('*', { count: 'exact', head: true })
    .eq('tenant_id', tenantId);

  if (!countErr && usersCount !== null && subscription.id !== 'temp-sub-id') {
    // Sync seats used in the database
    await supabase
      .from('tenant_subscriptions')
      .update({ seats_used: usersCount })
      .eq('id', subscription.id);
    subscription.seats_used = usersCount;
  } else if (usersCount !== null) {
    subscription.seats_used = usersCount;
  }

  // 3. Fetch billing invoices (SaaS invoices for this tenant)
  const { data: invoices } = await supabase
    .from('saas_invoices')
    .select('*')
    .eq('tenant_id', tenantId)
    .order('billing_date', { ascending: false });

  return apiSuccess({
    subscription: normalizeSubscription(subscription),
    invoices: (invoices || []).map((inv: any) => ({
      id: inv.id,
      invoiceNumber: inv.invoice_number,
      amount: Number(inv.amount),
      currency: inv.currency,
      status: inv.status,
      billingDate: inv.billing_date,
      dueDate: inv.due_date,
      pdfUrl: inv.pdf_url || null,
    })),
  }, 'Tenant subscription billing profile fetched successfully');
}, { requireAuth: true, roles: ['Employee'] });

// PUT: Update SaaS billing address or Tax identification settings
export const PUT = withApiHandler(async (request, context) => {
  const tenantId = context.auth?.user.tenantId;
  if (!tenantId) throw new BadRequestError('Tenant ID is required');

  const payload = await request.json();
  const supabase = getAdminRouteSupabase();

  const { data: subscription } = await supabase
    .from('tenant_subscriptions')
    .select('id')
    .eq('tenant_id', tenantId)
    .maybeSingle();

  if (!subscription) throw new NotFoundError('Billing subscription profile not found');

  const updateFields: Record<string, any> = {};
  if (payload.taxId !== undefined) updateFields.tax_id = payload.taxId?.trim() || null;
  if (payload.billingAddress !== undefined) updateFields.billing_address = payload.billingAddress;
  if (payload.cancelAtPeriodEnd !== undefined) updateFields.cancel_at_period_end = Boolean(payload.cancelAtPeriodEnd);
  updateFields.updated_at = new Date().toISOString();

  const { data: updated, error } = await supabase
    .from('tenant_subscriptions')
    .update(updateFields)
    .eq('id', subscription.id)
    .select('*')
    .single();

  if (error || !updated) {
    throw error ?? new Error('Failed to update subscription billing profile');
  }

  return apiSuccess(normalizeSubscription(updated), 'Billing profile updated successfully');
}, { requireAuth: true, roles: ['Admin'] });

// POST: Actions handler (upgrade, downgrade, add-ons, payment method bind, coupon application)
export const POST = withApiHandler(async (request, context) => {
  const tenantId = context.auth?.user.tenantId;
  if (!tenantId) throw new BadRequestError('Tenant ID is required');

  const { action, ...params } = await request.json();
  if (!action) throw new BadRequestError('Billing sub-action required');

  const supabase = getAdminRouteSupabase();

  const { data: subscription } = await supabase
    .from('tenant_subscriptions')
    .select('*')
    .eq('tenant_id', tenantId)
    .maybeSingle();

  if (!subscription) throw new NotFoundError('Subscription profile not configured');

  const now = new Date().toISOString();

  switch (action) {
    case 'upgrade':
    case 'downgrade': {
      const planCode = params.planCode;
      if (!planCode) throw new BadRequestError('Pricing plan code is required');

      let planName = 'Growth Plan';
      let priceAmount = 14990.00;
      let seatsLimit = 25;
      let storageLimitGb = 25.00;

      if (planCode === 'enterprise_pro') {
        planName = 'Enterprise Pro';
        priceAmount = 49990.00;
        seatsLimit = 100;
        storageLimitGb = 100.00;
      } else if (planCode === 'growth') {
        planName = 'Growth Plan';
        priceAmount = 14990.00;
        seatsLimit = 25;
        storageLimitGb = 25.00;
      } else if (planCode === 'free') {
        planName = 'Free Trial';
        priceAmount = 0.00;
        seatsLimit = 5;
        storageLimitGb = 5.00;
      }

      // Apply coupon discount if existing
      if (subscription.applied_coupon === 'WELCOME50') {
        priceAmount = priceAmount * 0.5;
      }

      const { data: updated, error } = await supabase
        .from('tenant_subscriptions')
        .update({
          plan_code: planCode,
          plan_name: planName,
          price_amount: priceAmount,
          seats_limit: seatsLimit,
          storage_limit_gb: storageLimitGb,
          status: 'active',
          current_period_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
          updated_at: now,
        })
        .eq('id', subscription.id)
        .select('*')
        .single();

      if (error || !updated) throw error ?? new Error('Plan migration failed');

      // Create new SaaS billing invoice
      const invoiceNumber = `INV-SUB-${Date.now().toString().slice(-6)}`;
      await supabase
        .from('saas_invoices')
        .insert({
          tenant_id: tenantId,
          invoice_number: invoiceNumber,
          amount: priceAmount,
          currency: subscription.currency,
          status: priceAmount > 0 ? 'paid' : 'free',
          billing_date: new Date().toISOString().split('T')[0],
          due_date: new Date().toISOString().split('T')[0],
          pdf_url: '#',
        });

      return apiSuccess(normalizeSubscription(updated), `Plan updated to ${planName} successfully`);
    }

    case 'addons': {
      const { addons } = params;
      if (!Array.isArray(addons)) throw new BadRequestError('Addons array is required');

      let seatsLimitAddition = 0;
      let storageLimitAddition = 0.00;
      let priceAddition = 0.00;

      addons.forEach((addon: any) => {
        if (addon.id === 'extra-storage-50gb') {
          storageLimitAddition += 50.00;
          priceAddition += 1490.00;
        } else if (addon.id === 'extra-seats-10') {
          seatsLimitAddition += 10;
          priceAddition += 2990.00;
        }
      });

      // Calculate base pricing limits
      let baseSeats = 10;
      let baseStorage = 5.00;
      let basePrice = 0.00;

      if (subscription.plan_code === 'enterprise_pro') {
        baseSeats = 100;
        baseStorage = 100.00;
        basePrice = 49990.00;
      } else if (subscription.plan_code === 'growth') {
        baseSeats = 25;
        baseStorage = 25.00;
        basePrice = 14990.00;
      }

      if (subscription.applied_coupon === 'WELCOME50') {
        basePrice = basePrice * 0.5;
      }

      const newSeatsLimit = baseSeats + seatsLimitAddition;
      const newStorageLimit = baseStorage + storageLimitAddition;
      const newPrice = basePrice + priceAddition;

      const { data: updated, error } = await supabase
        .from('tenant_subscriptions')
        .update({
          seats_limit: newSeatsLimit,
          storage_limit_gb: newStorageLimit,
          price_amount: newPrice,
          addons: addons,
          updated_at: now,
        })
        .eq('id', subscription.id)
        .select('*')
        .single();

      if (error || !updated) throw error ?? new Error('Failed to update add-ons configurations');

      return apiSuccess(normalizeSubscription(updated), 'Add-ons updated successfully');
    }

    case 'apply-coupon': {
      const code = params.couponCode?.trim().toUpperCase();
      if (!code) throw new BadRequestError('Coupon code is required');

      if (code !== 'WELCOME50') {
        throw new BadRequestError('Invalid or expired coupon code');
      }

      // 50% discount on plan price
      const discountedPrice = Number(subscription.price_amount) * 0.5;

      const { data: updated, error } = await supabase
        .from('tenant_subscriptions')
        .update({
          applied_coupon: code,
          price_amount: discountedPrice,
          updated_at: now,
        })
        .eq('id', subscription.id)
        .select('*')
        .single();

      if (error || !updated) throw error ?? new Error('Failed to apply promo code');

      return apiSuccess(normalizeSubscription(updated), 'Coupon code applied successfully! 50% discount has been activated.');
    }

    case 'payment-method': {
      const { brand, last4 } = params;
      if (!brand || !last4) throw new BadRequestError('Card details required (brand, last4)');

      const { data: updated, error } = await supabase
        .from('tenant_subscriptions')
        .update({
          payment_method_brand: brand,
          payment_method_last4: last4,
          updated_at: now,
        })
        .eq('id', subscription.id)
        .select('*')
        .single();

      if (error || !updated) throw error ?? new Error('Payment method registration failed');

      return apiSuccess(normalizeSubscription(updated), 'Payment card bound successfully');
    }

    default:
      throw new BadRequestError(`Unrecognized billing action: ${action}`);
  }
}, { requireAuth: true, roles: ['Admin'] });
