import Stripe from 'stripe';
import { env } from '@/server/config/env';
import { getSupabaseAdminClient } from '@/server/supabase/admin';

// Initialize Stripe Client
export const stripe = new Stripe(env.STRIPE_SECRET_KEY || 'sk_test_dummy', {
  apiVersion: '2025-01-27.acacia' as any,
});

/**
 * Creates or retrieves a Stripe Customer ID for a Tenant
 */
export async function getOrCreateStripeCustomer(tenantId: string) {
  const supabase = getSupabaseAdminClient();

  // 1. Fetch tenant from database
  const { data: tenant, error } = await supabase
    .from('tenants')
    .select('*')
    .eq('id', tenantId)
    .single();

  if (error || !tenant) {
    throw new Error(`Tenant not found: ${error?.message || ''}`);
  }

  // 2. Check if Stripe Customer ID is already present in custom settings or metadata
  const { data: settings } = await supabase
    .from('company_settings')
    .select('stripe_customer_id')
    .eq('tenant_id', tenantId)
    .maybeSingle();

  if (settings?.stripe_customer_id) {
    return settings.stripe_customer_id;
  }

  // 3. Create customer on Stripe
  const customer = await stripe.customers.create({
    name: tenant.name,
    email: `billing@${tenant.slug}.com`, // Default email fallback
    metadata: {
      tenantId: tenant.id,
      tenantSlug: tenant.slug,
    },
  });

  // 4. Update customer ID in settings
  await supabase
    .from('company_settings')
    .upsert({
      tenant_id: tenantId,
      stripe_customer_id: customer.id,
      updated_at: new Date().toISOString(),
    });

  return customer.id;
}

/**
 * Generates a Checkout Session for Tenant subscription upgrade
 */
export async function createCheckoutSession(tenantId: string, priceId: string, returnUrl: string) {
  const customerId = await getOrCreateStripeCustomer(tenantId);

  const session = await stripe.checkout.sessions.create({
    customer: customerId,
    payment_method_types: ['card'],
    line_items: [
      {
        price: priceId,
        quantity: 1,
      },
    ],
    mode: 'subscription',
    success_url: `${returnUrl}?session_id={CHECKOUT_SESSION_ID}&success=true`,
    cancel_url: `${returnUrl}?success=false`,
    metadata: {
      tenantId,
    },
  });

  return session.url;
}

/**
 * Syncs Stripe subscription updates directly to database
 */
export async function handleSubscriptionUpdate(subscriptionId: string) {
  const supabase = getSupabaseAdminClient();
  const subscription = await stripe.subscriptions.retrieve(subscriptionId);
  const tenantId = subscription.metadata.tenantId;

  if (!tenantId) {
    console.error(`Stripe Subscription ${subscriptionId} has no tenantId metadata`);
    return;
  }

  const planCode = subscription.items.data[0]?.price.id;
  const status = subscription.status === 'active' ? 'active' : 'suspended';

  // Update tenant billing plan
  const { error } = await supabase
    .from('tenants')
    .update({
      plan_code: planCode,
      status: status,
      updated_at: new Date().toISOString(),
    })
    .eq('id', tenantId);

  if (error) {
    console.error(`Failed to update tenant subscription status for tenant ${tenantId}:`, error.message);
  }
}
