import { redirect, notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { AuditWorkbench } from "@/components/audit/audit-workbench";
import type { AppRecord } from "@/lib/types";

export default async function AuditPage({
  params,
}: {
  params: Promise<{ storeId: string }>;
}) {
  const { storeId } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(`/login?redirect=/audit/${storeId}`);
  }

  const { data: store } = await supabase
    .from("stores")
    .select("id, shop_name, shopify_domain, last_synced_at")
    .eq("id", storeId)
    .eq("user_id", user.id)
    .single();

  if (!store) {
    notFound();
  }

  const { data: apps } = await supabase
    .from("apps")
    .select("*")
    .eq("store_id", storeId)
    .order("monthly_cost", { ascending: false, nullsFirst: false });

  return (
    <AuditWorkbench
      store={{
        id: store.id,
        shop_name: store.shop_name,
        shopify_domain: store.shopify_domain,
        last_synced_at: store.last_synced_at,
      }}
      initialApps={(apps ?? []) as AppRecord[]}
    />
  );
}
