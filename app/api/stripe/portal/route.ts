import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getStripe } from "@/lib/stripe";

/**
 * POST /api/stripe/portal
 * Creates a Stripe Customer Portal session so the user can manage
 * their subscription (cancel, update card, view invoices).
 */
export async function POST() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("stripe_customer_id")
    .eq("id", user.id)
    .single();

  if (!profile?.stripe_customer_id) {
    return NextResponse.json(
      { success: false, error: "No billing account found. Subscribe to Pro first." },
      { status: 404 }
    );
  }

  const stripe = getStripe();
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

  try {
    const session = await stripe.billingPortal.sessions.create({
      customer: profile.stripe_customer_id,
      return_url: `${appUrl}/billing`,
    });
    return NextResponse.json({ success: true, data: { url: session.url } });
  } catch {
    return NextResponse.json(
      { success: false, error: "Could not open billing portal" },
      { status: 500 }
    );
  }
}
