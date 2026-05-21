import { NextRequest, NextResponse } from 'next/server';
import { stripe, handleSubscriptionUpdate } from '@/server/finance/stripe';
import { env } from '@/server/config/env';
import { getSupabaseAdminClient } from '@/server/supabase/admin';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  const body = await request.text();
  const signature = request.headers.get('stripe-signature') || '';

  let event;
  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      env.STRIPE_WEBHOOK_SECRET || ''
    );
  } catch (error: any) {
    console.error(`Stripe Webhook signature verification failed: ${error.message}`);
    return NextResponse.json(
      { error: 'Webhook signature verification failed' },
      { status: 400 }
    );
  }

  const supabase = getSupabaseAdminClient();

  try {
    switch (event.type) {
      case 'customer.subscription.created':
      case 'customer.subscription.updated': {
        const subscription = event.data.object as any;
        await handleSubscriptionUpdate(subscription.id);
        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as any;
        const tenantId = subscription.metadata.tenantId;

        if (tenantId) {
          await supabase
            .from('tenants')
            .update({
              plan_code: null,
              status: 'suspended',
              updated_at: new Date().toISOString(),
            })
            .eq('id', tenantId);
        }
        break;
      }

      case 'invoice.payment_succeeded': {
        const invoice = event.data.object as any;
        const tenantId = invoice.subscription_details?.metadata?.tenantId || invoice.metadata?.tenantId;

        if (tenantId && invoice.charge) {
          // Log payment transaction record
          await supabase
            .from('payments')
            .insert({
              tenant_id: tenantId,
              amount: invoice.amount_paid / 100,
              payment_method: 'card',
              transaction_id: invoice.charge,
              status: 'paid',
              created_at: new Date().toISOString(),
            });
        }
        break;
      }

      default:
        console.log(`Unhandled Stripe Webhook event type: ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (error: any) {
    console.error(`Stripe Webhook processing error for event ${event.type}:`, error.message);
    return NextResponse.json(
      { error: 'Internal processing error' },
      { status: 500 }
    );
  }
}
