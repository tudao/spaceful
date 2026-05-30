import Stripe from 'stripe';

export function getStripe() {
  return new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: '2025-02-24.acacia' });
}

export const CREDIT_PACKAGES = [
  { credits: 5,  price: 3,  priceId: process.env.STRIPE_PRICE_CREDITS_5  ?? '',  label: '5 credits',  highlight: false },
  { credits: 10, price: 5,  priceId: process.env.STRIPE_PRICE_CREDITS_10 ?? '',  label: '10 credits', highlight: true  },
  { credits: 20, price: 9,  priceId: process.env.STRIPE_PRICE_CREDITS_20 ?? '',  label: '20 credits', highlight: false },
] as const;

export const SUBSCRIPTION_PRICE_ID = process.env.STRIPE_PRICE_SUBSCRIPTION ?? '';
export const SUBSCRIPTION_MONTHLY_CREDITS = 20;
export const SUBSCRIPTION_ROLLOVER_CAP    = 40;
