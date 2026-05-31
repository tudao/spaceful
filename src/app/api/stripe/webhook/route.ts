import Stripe from 'stripe';
import { headers } from 'next/headers';
import { NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';
import { getSettings } from '@/lib/platform-settings';

export async function POST(request: Request) {
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: '2025-02-24.acacia' });
  const body = await request.text();
  const headersList = await headers();
  const sig = headersList.get('stripe-signature')!;

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET!);
  } catch {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const svc = await createServiceClient() as any;

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session;
    const userId = session.metadata?.user_id;
    if (!userId || session.payment_status !== 'paid') return NextResponse.json({ received: true });

    // Idempotency: skip if already processed this session
    const { data: existing } = await svc
      .from('credit_transactions')
      .select('id')
      .like('note', `%${session.id}%`)
      .maybeSingle();
    if (existing) return NextResponse.json({ received: true });

    const credits = session.metadata?.credits ? parseInt(session.metadata.credits, 10) : 0;
    if (credits > 0) {
      await svc.rpc('grant_credits', {
        p_user_id:   userId,
        p_delta:     credits,
        p_action:    'purchase',
        p_stripe_id: session.id,
        p_note:      `Top-up ${credits} credits session=${session.id}`,
      });
    }
  }

  if (event.type === 'invoice.paid') {
    const invoice = event.data.object as Stripe.Invoice;
    const customerId = invoice.customer as string;
    if (!invoice.subscription) return NextResponse.json({ received: true });

    // Idempotency: skip if already processed this invoice
    const { data: existing } = await svc
      .from('credit_transactions')
      .select('id')
      .like('note', `%${invoice.id}%`)
      .maybeSingle();
    if (existing) return NextResponse.json({ received: true });

    const { data: profile } = await svc
      .from('profiles')
      .select('user_id')
      .eq('stripe_customer_id', customerId)
      .maybeSingle() as { data: { user_id: string } | null };
    if (!profile) return NextResponse.json({ received: true });

    const settings = await getSettings();
    await svc.rpc('grant_credits', {
      p_user_id:   profile.user_id,
      p_delta:     settings.signup_gift_credits,
      p_action:    'subscription_renewal',
      p_stripe_id: invoice.id,
      p_note:      `Subscription renewal invoice=${invoice.id}`,
    });
    await svc.from('profiles').update({ subscription_status: 'active' }).eq('user_id', profile.user_id);
  }

  if (event.type === 'customer.subscription.deleted') {
    const sub = event.data.object as Stripe.Subscription;
    const customerId = sub.customer as string;

    const { data: profile } = await svc
      .from('profiles')
      .select('user_id')
      .eq('stripe_customer_id', customerId)
      .maybeSingle() as { data: { user_id: string } | null };
    if (!profile) return NextResponse.json({ received: true });

    const expiry = new Date();
    expiry.setDate(expiry.getDate() + 90);
    await svc.from('profiles').update({
      subscription_status: 'cancelled',
      credits_expiry_at:   expiry.toISOString(),
    }).eq('user_id', profile.user_id);
  }

  return NextResponse.json({ received: true });
}

export const config = { api: { bodyParser: false } };
