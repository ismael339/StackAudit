import { NextResponse } from "next/server";
import { createAdminClient, createClient } from "@/lib/supabase/server";
import { verifyShopifyHmac, exchangeShopifyToken, fetchShopDetails } from "@/lib/shopify";
import { encryptToken } from "@/lib/token-crypto";

/**
 * GET /api/shopify/callback
 * Shopify redirects here after the merchant approves the app.
 */
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const shop = searchParams.get("shop");
  const code = searchParams.get("code");
  const state = searchParams.get("state");

  if (!shop || !code || !state) {
    return NextResponse.redirect(`${origin}/dashboard?error=missing_oauth_params`);
  }

  if (!verifyShopifyHmac(Object.fromEntries(new URL(request.url).searchParams))) {
    return NextResponse.redirect(`${origin}/dashboard?error=invalid_hmac`);
  }

  // Validate state: decode and check expiry
  let statePayload: { uid: string; sid: string | null; exp: number };
  try {
    statePayload = JSON.parse(Buffer.from(state, "base64url").toString("utf8"));
  } catch {
    return NextResponse.redirect(`${origin}/dashboard?error=invalid_state`);
  }
  if (!statePayload.uid || Date.now() > statePayload.exp) {
    return NextResponse.redirect(`${origin}/dashboard?error=invalid_state`);
  }

  // Ensure the session still matches the state's user
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user || user.id !== statePayload.uid) {
    return NextResponse.redirect(`${origin}/login?redirect=/dashboard`);
  }

  try {
    const { accessToken } = await exchangeShopifyToken(shop, code);
    const shopDetails = await fetchShopDetails(shop, accessToken);
    const encrypted = encryptToken(accessToken);
    const admin = createAdminClient();

    if (statePayload.sid) {
      // Re-connect existing store
      await admin
        .from("stores")
        .update({
          shopify_domain: shop,
          shop_name: shopDetails?.name ?? null,
          access_token: encrypted,
          last_synced_at: new Date().toISOString(),
        })
        .eq("id", statePayload.sid)
        .eq("user_id", user.id);
      return NextResponse.redirect(`${origin}/audit/${statePayload.sid}`);
    }

    const { data: store, error } = await admin
      .from("stores")
      .upsert(
        {
          user_id: user.id,
          shopify_domain: shop,
          shop_name: shopDetails?.name ?? null,
          access_token: encrypted,
          last_synced_at: new Date().toISOString(),
        },
        { onConflict: "user_id,shopify_domain" }
      )
      .select("id")
      .single();

    if (error || !store) {
      return NextResponse.redirect(`${origin}/dashboard?error=store_save_failed`);
    }

    return NextResponse.redirect(`${origin}/audit/${store.id}`);
  } catch {
    return NextResponse.redirect(`${origin}/dashboard?error=token_exchange_failed`);
  }
}
