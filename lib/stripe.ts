import Stripe from "stripe";

let stripeClient: Stripe | null = null;

/** Lazily-initialised Stripe singleton. */
export function getStripe(): Stripe {
  if (!stripeClient) {
    const key = process.env.STRIPE_SECRET_KEY;
    if (!key) {
      throw new Error("STRIPE_SECRET_KEY is not configured");
    }
    stripeClient = new Stripe(key, {
      apiVersion: "2025-02-24.acacia",
      typescript: true,
      appInfo: {
        name: "StackAudit",
        version: "1.0.0",
      },
    });
  }
  return stripeClient;
}

export const STRIPE_PLANS = {
  monthly: {
    priceId: () => process.env.STRIPE_PRICE_ID_MONTHLY ?? "",
    label: "Pro Monthly",
    amount: 2900,
    interval: "month" as const,
  },
  yearly: {
    priceId: () => process.env.STRIPE_PRICE_ID_YEARLY ?? "",
    label: "Pro Yearly",
    amount: 29000,
    interval: "year" as const,
  },
};

export type BillingInterval = keyof typeof STRIPE_PLANS;
