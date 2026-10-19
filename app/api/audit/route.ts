import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient, createAdminClient } from "@/lib/supabase/server";
import { decryptToken } from "@/lib/token-crypto";
import { fetchInstalledApps } from "@/lib/shopify";
import { detectCategory, detectRedundantApps, analyzeApps } from "@/lib/audit";
import { FREE_PLAN_LIMITS, type AppRecord } from "@/lib/types";

const syncSchema = z.object({
  storeId: z.string().uuid(),
});

/**
 * POST /api/audit
 * Body: { storeId }
 *
 * 1. Verifies the caller owns the store.
 * 2. Enforces free-plan audit limits.
 * 3. Pulls installed apps from Shopify and upserts them.
 * 4. Runs the analysis and stores an audit record.
 */
export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  let body: z.infer<typeof syncSchema>;
  try {
    body = syncSchema.parse(await request.json());
  } catch {
    return NextResponse.json({ success: false, error: "Invalid request body" }, { status: 400 });
  }

  // Ownership check (RLS would also enforce this, explicit for clarity)
  const { data: store, error: storeError } = await supabase
    .from("stores")
    .select("id, shopify_domain, access_token, user_id")
    .eq("id", body.storeId)
    .single();

  if (storeError || !store || store.user_id !== user.id) {
    return NextResponse.json({ success: false, error: "Store not found" }, { status: 404 });
  }

  // Free-plan audit limit
  const { data: profile } = await supabase
    .from("profiles")
    .select("plan")
    .eq("id", user.id)
    .single();

  if (profile?.plan === "free") {
    const { data: countFn } = await supabase.rpc("audit_count_this_month", {
      p_user_id: user.id,
    });
    const used = typeof countFn === "number" ? countFn : Number(countFn ?? 0);
    if (used >= FREE_PLAN_LIMITS.max_audits_per_month) {
      return NextResponse.json(
        {
          success: false,
          error: "Free plan limit reached (3 audits/month). Upgrade to Pro for unlimited audits.",
          code: "PLAN_LIMIT",
        },
        { status: 403 }
      );
    }
  }

  const accessToken = store.access_token ? decryptToken(store.access_token) : "";
  if (!accessToken) {
    return NextResponse.json(
      { success: false, error: "Store connection expired. Please reconnect your store.", code: "RECONNECT_REQUIRED" },
      { status: 400 }
    );
  }

  // Pull installed apps from Shopify
  let shopifyApps;
  try {
    shopifyApps = await fetchInstalledApps(store.shopify_domain, accessToken);
  } catch {
    return NextResponse.json(
      { success: false, error: "Failed to reach Shopify. Try again shortly." },
      { status: 502 }
    );
  }

  const admin = createAdminClient();

  // Upsert apps; preserve manually-entered costs/categories on conflict
  const appRows = shopifyApps.map((app) => ({
    store_id: store.id,
    shopify_app_id: String(app.id),
    title: app.title,
    handle: app.handle,
    installed_at: app.installed_at,
    category: detectCategory(app.title, app.handle),
  }));

  if (appRows.length > 0) {
    const { error: upsertError } = await admin
      .from("apps")
      .upsert(appRows, { onConflict: "store_id,shopify_app_id", ignoreDuplicates: true });
    if (upsertError) {
      return NextResponse.json(
        { success: false, error: "Failed to save apps" },
        { status: 500 }
      );
    }
  }

  // Re-read full app records (includes previously saved costs)
  const { data: apps } = await admin
    .from("apps")
    .select("*")
    .eq("store_id", store.id);

  const records = (apps ?? []) as AppRecord[];
  const redundantIds = detectRedundantApps(records);

  // Persist redundancy flags
  await admin
    .from("apps")
    .update({ is_redundant: false })
    .eq("store_id", store.id);
  if (redundantIds.size > 0) {
    await admin
      .from("apps")
      .update({ is_redundant: true })
      .in("id", Array.from(redundantIds));
  }

  const analysis = analyzeApps(records);

  // Save the audit
  const { data: audit, error: auditError } = await admin
    .from("audits")
    .insert({
      store_id: store.id,
      total_monthly_cost: analysis.totalMonthlyCost,
      potential_savings: analysis.potentialSavings,
      recommendations: analysis.recommendations,
    })
    .select("id, created_at")
    .single();

  if (auditError) {
    return NextResponse.json(
      { success: false, error: "Failed to save audit" },
      { status: 500 }
    );
  }

  await admin
    .from("stores")
    .update({ last_synced_at: new Date().toISOString() })
    .eq("id", store.id);

  return NextResponse.json({
    success: true,
    data: {
      audit,
      apps: records,
      totalMonthlyCost: analysis.totalMonthlyCost,
      potentialSavings: analysis.potentialSavings,
      recommendations: analysis.recommendations,
    },
  });
}
