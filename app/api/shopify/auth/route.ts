import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { buildShopifyAuthUrl } from "@/lib/shopify";
import { normalizeShopDomain, isValidShopDomain } from "@/lib/utils";

/**
 * GET /api/shopify/auth?shop=mystore.myshopify.com&storeId=<optional>
 *
 * Starts the Shopify OAuth flow. If `storeId` is present the store is
 * being re-connected; otherwise a brand-new store connection is created.
 * Requires an authenticated Supabase session.
 */
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const rawShop = searchParams.get("shop") ?? "";
  const storeId = searchParams.get("storeId");

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.redirect(`${origin}/login?redirect=/dashboard`);
  }

  const shop = normalizeShopDomain(rawShop);
  if (!isValidShopDomain(shop)) {
    return NextResponse.redirect(
      `${origin}/dashboard?error=invalid_shop_domain`
    );
  }

  // For new connections, check the free-plan store limit
  if (!storeId) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("plan")
      .eq("id", user.id)
      .single();

    if (profile?.plan === "free") {
      const { count } = await supabase
        .from("stores")
        .select("id", { count: "exact", head: true })
        .eq("user_id", user.id);

      if ((count ?? 0) >= 1) {
        return NextResponse.redirect(
          `${origin}/billing?error=store_limit_reached`
        );
      }
    }
  }

  // Persist the pending connection target in a short-lived signed-ish state.
  // We pass the user id + optional store id through Shopify's `state` param
  // and verify the session again on callback.
  const state = Buffer.from(
    JSON.stringify({ uid: user.id, sid: storeId ?? null, exp: Date.now() + 600_000 })
  ).toString("base64url");

  const authUrl = buildShopifyAuthUrl(shop);
  const urlWithState = `${authUrl}&state=${encodeURIComponent(state)}`;

  return NextResponse.redirect(urlWithState);
}
