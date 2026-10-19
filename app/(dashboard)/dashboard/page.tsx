import Link from "next/link";
import { Suspense } from "react";
import { redirect } from "next/navigation";
import { Plus, Store as StoreIcon, DollarSign, Package, PiggyBank, PlayCircle } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { ConnectStoreDialog } from "@/components/dashboard/connect-store-dialog";
import { formatDateRelative, formatCurrency } from "@/lib/utils";

interface StoreWithStats {
  id: string;
  shop_name: string | null;
  shopify_domain: string;
  last_synced_at: string | null;
  app_count: number;
  total_cost: number;
  latest_audit_at: string | null;
  potential_savings: number | null;
}

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?redirect=/dashboard");
  }

  const { data: stores } = await supabase
    .from("stores")
    .select("id, shop_name, shopify_domain, last_synced_at")
    .eq("user_id", user.id)
    .order("created_at", { ascending: true });

  const storeIds = (stores ?? []).map((s) => s.id);
  let appsByStore = new Map<string, { count: number; cost: number }>();
  let latestAudits = new Map<string, { created_at: string; potential_savings: number }>();

  if (storeIds.length > 0) {
    const [appsRes, auditsRes] = await Promise.all([
      supabase.from("apps").select("store_id, monthly_cost").in("store_id", storeIds),
      supabase
        .from("audits")
        .select("store_id, created_at, potential_savings")
        .in("store_id", storeIds)
        .order("created_at", { ascending: false }),
    ]);

    const tmpApps = new Map<string, { count: number; cost: number }>();
    for (const row of appsRes.data ?? []) {
      const entry = tmpApps.get(row.store_id) ?? { count: 0, cost: 0 };
      entry.count += 1;
      entry.cost += Number(row.monthly_cost ?? 0);
      tmpApps.set(row.store_id, entry);
    }
    appsByStore = tmpApps;

    const tmpAudits = new Map<string, { created_at: string; potential_savings: number }>();
    for (const row of auditsRes.data ?? []) {
      if (!tmpAudits.has(row.store_id)) {
        tmpAudits.set(row.store_id, {
          created_at: row.created_at,
          potential_savings: Number(row.potential_savings ?? 0),
        });
      }
    }
    latestAudits = tmpAudits;
  }

  const storeStats: StoreWithStats[] = (stores ?? []).map((s) => {
    const apps = appsByStore.get(s.id) ?? { count: 0, cost: 0 };
    const audit = latestAudits.get(s.id);
    return {
      id: s.id,
      shop_name: s.shop_name,
      shopify_domain: s.shopify_domain,
      last_synced_at: s.last_synced_at,
      app_count: apps.count,
      total_cost: apps.cost,
      latest_audit_at: audit?.created_at ?? null,
      potential_savings: audit?.potential_savings ?? null,
    };
  });

  const totals = storeStats.reduce(
    (acc, s) => ({
      cost: acc.cost + s.total_cost,
      apps: acc.apps + s.app_count,
      savings: acc.savings + (s.potential_savings ?? 0),
    }),
    { cost: 0, apps: 0, savings: 0 }
  );

  return (
    <div className="mx-auto max-w-5xl space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-sm text-muted-foreground">
            Overview of your connected Shopify stores.
          </p>
        </div>
        <Button asChild>
          <Link href="/dashboard?connect=1">
            <Plus aria-hidden="true" />
            Connect new store
          </Link>
        </Button>
      </div>

      {/* Stat cards */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Monthly app spend</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totals.cost)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Installed apps</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totals.apps}</div>
          </CardContent>
        </Card>
        <Card className="border-success/40">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Potential savings</CardTitle>
            <PiggyBank className="h-4 w-4 text-success" aria-hidden="true" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-success">
              {formatCurrency(totals.savings)}
              <span className="text-sm font-normal text-muted-foreground">/mo</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Stores */}
      {storeStats.length === 0 ? (
        <Card className="flex flex-col items-center justify-center py-16 text-center">
          <StoreIcon className="mb-4 h-10 w-10 text-muted-foreground" aria-hidden="true" />
          <CardTitle className="text-lg">No stores connected yet</CardTitle>
          <CardDescription className="mt-2 max-w-sm">
            Connect your Shopify store to see every installed app, its cost, and where
            you can save.
          </CardDescription>
          <Button asChild className="mt-6">
            <Link href="/dashboard?connect=1">
              <Plus aria-hidden="true" />
              Connect your first store
            </Link>
          </Button>
        </Card>
      ) : (
        <div className="grid gap-4">
          {storeStats.map((store) => (
            <Card key={store.id}>
              <CardHeader className="flex flex-row items-start justify-between space-y-0">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    {store.shop_name ?? store.shopify_domain}
                    {store.potential_savings !== null && store.potential_savings > 0 && (
                      <Badge variant="success">
                        Save {formatCurrency(store.potential_savings)}/mo
                      </Badge>
                    )}
                  </CardTitle>
                  <CardDescription>{store.shopify_domain}</CardDescription>
                </div>
                <div className="flex gap-2">
                  <Button asChild size="sm" variant="outline">
                    <Link href={`/audit/${store.id}`}>
                      <PlayCircle aria-hidden="true" />
                      {store.latest_audit_at ? "View audit" : "Run audit"}
                    </Link>
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-3 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground">Apps</p>
                    <p className="font-semibold">{store.app_count}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Monthly cost</p>
                    <p className="font-semibold">{formatCurrency(store.total_cost)}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Last synced</p>
                    <p className="font-semibold">
                      {store.last_synced_at
                        ? formatDateRelative(store.last_synced_at)
                        : "Never"}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Suspense fallback={<Skeleton className="h-0 w-0" />}>
        <ConnectStoreDialog />
      </Suspense>
    </div>
  );
}
