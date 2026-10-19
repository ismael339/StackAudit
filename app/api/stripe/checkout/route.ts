import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { getStripe, STRIPE_PLANS, type BillingInterval } from "@/lib/stripe";

const checkoutSchema = z.object({
  interval: z.enum(["monthly", "yearly"]),
});

/**
 * POST /api/stripe/checkout
 * Body: { interval: "monthly" | "yearly" }
 * Creates a Stripe Checkout session for the Pro plan.
 */
export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  let body: z.infer<typeof checkoutSchema>;
  try {
    body = checkoutSchema.parse(await request.json());
  } catch {
    return NextResponse.json({ success: false, error: "Invalid request body" }, { status: 400 });
  }

  const plan = STRIPE_PLANS[body.interval as BillingInterval];
  const priceId = plan.priceId();
  if (!priceId) {
    return NextResponse.json(
      { success: false, error: "Billing is not configured" },
      { status: 500 }
    );
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, email, stripe_customer_id")
    .eq("id", user.id)
    .single();

  if (!profile) {
    return NextResponse.json({ success: false, error: "Profile not found" }, { status: 404 });
  }

  const stripe = getStripe();
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

  try {
    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      customer: profile.stripe_customer_id ?? undefined,
      customer_email: profile.stripe_customer_id ? undefined : profile.email,
      line_items: [{ price: priceId, quantity: 1 }],
      subscription_data: {
        metadata: { user_id: user.id },
      },
      metadata: { user_id: user.id },
      success_url: `${appUrl}/billing?success=1`,
      cancel_url: `${appUrl}/billing?canceled=1`,
    });

    return NextResponse.json({ success: true, data: { url: session.url } });
  } catch {
    return NextResponse.json(
      { success: false, error: "Could not create checkout session" },
      { status: 500 }
    );
  }
}
