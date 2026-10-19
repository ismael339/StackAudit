import { NextResponse } from "next/server";
import type Stripe from "stripe";
import { getStripe } from "@/lib/stripe";
import { createAdminClient } from "@/lib/supabase/server";

/**
 * POST /api/stripe/webhook
 * Handles subscription lifecycle events. Verifies the signature using
 * STRIPE_WEBHOOK_SECRET and updates profiles.plan accordingly.
 */

async function setPlanByCustomerId(customerId: string, plan: "free" | "pro") {
  const admin = createAdminClient();
  await admin.from("profiles").update({ plan }).eq("stripe_customer_id", customerId);
}

async function setPlanByUserId(userId: string, plan: "free" | "pro", customerId?: string) {
  const admin = createAdminClient();
  const patch: { plan: "free" | "pro"; stripe_customer_id?: string } = { plan };
  if (customerId) patch.stripe_customer_id = customerId;
  await admin.from("profiles").update(patch).eq("id", userId);
}

async function handleSubscriptionChange(
  subscription: Stripe.Subscription,
  active: boolean
) {
  const customerId =
    typeof subscription.customer === "string"
      ? subscription.customer
      : subscription.customer.id;
  const userId = subscription.metadata?.user_id;
  const plan: "free" | "pro" = active ? "pro" : "free";

  if (userId) {
    await setPlanByUserId(userId, plan, customerId);
  } else {
    await setPlanByCustomerId(customerId, plan);
  }
}

export async function POST(request: Request) {
  const signature = request.headers.get("stripe-signature");
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!signature || !webhookSecret) {
    return NextResponse.json({ error: "Missing signature or secret" }, { status: 400 });
  }

  const stripe = getStripe();
  const body = await request.text();

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
  } catch {
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object;
        const userId = session.metadata?.user_id;
        if (session.customer && userId) {
          const customerId =
            typeof session.customer === "string" ? session.customer : session.customer.id;
          await setPlanByUserId(userId, "pro", customerId);
        }
        break;
      }
      case "customer.subscription.created":
      case "customer.subscription.updated": {
        const subscription = event.data.object;
        const isActive =
          subscription.status === "active" || subscription.status === "trialing";
        await handleSubscriptionChange(subscription, isActive);
        break;
      }
      case "customer.subscription.deleted": {
        await handleSubscriptionChange(event.data.object, false);
        break;
      }
      default:
        // Unhandled event types are acknowledged
        break;
    }
  } catch {
    return NextResponse.json({ error: "Webhook handler failed" }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}
