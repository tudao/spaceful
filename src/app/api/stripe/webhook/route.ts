// Stripe webhook: grant credits on purchase / subscription renewal.
import Stripe from 'stripe';
import { headers } from 'next/headers';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: '2025-02-24.acacia' });
  const body = await request.text();
  const headersList = await headers();
  const sig = headersList.get('stripe-signature')!;

  let event;
  try {
    event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET!);
  } catch {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
  }

  switch (event.type) {
    case 'checkout.session.completed':
      // TODO: grant top-up credits via deduct_credits RPC (positive delta)
      break;
    case 'invoice.paid':
      // TODO: grant subscription renewal credits (cap at SUBSCRIPTION_ROLLOVER_CAP)
      break;
    case 'customer.subscription.deleted':
      // TODO: update subscription_status → cancelled, set credits_expiry_at = now + 90 days
      break;
  }

  return NextResponse.json({ received: true });
}

export const config = { api: { bodyParser: false } };
