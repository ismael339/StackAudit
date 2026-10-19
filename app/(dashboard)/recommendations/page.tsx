import Link from "next/link";
import { redirect } from "next/navigation";
import { Lightbulb, TrendingUp, ArrowRight } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { formatCurrency } from "@/lib/utils";
import type { Recommendation } from "@/lib/types";

interface StoreRecommendations {
  storeId: string;
  storeName: string;
  recommendations: Recommendation[];
}

const TYPE_LABEL: Record<
  Recommendation["type"],
  { label: string; variant: "destructive" | "warning" | "secondary" | "success" }
> = {
  redundant: { label: "Redundant", variant: "destructive" },
  expensive: { label: "Expensive", variant: "warning" },
  unused: { label: "Unused", variant: "secondary" },
  downgrade: { label: "Downgrade", variant: "success" },
};

export default async function RecommendationsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?redirect=/recommendations");
  }

  const { data: stores } = await supabase
    .from("stores")
    .select("id, shop_name, shopify_domain")
    .eq("user_id", user.id);

  const storeIds = (stores ?? []).map((s) => s.id);
  let byStore: StoreRecommendations[] = [];

  if (storeIds.length > 0) {
    const { data: audits } = await supabase
      .from("audits")
      .select("store_id, recommendations, created_at")
      .in("store_id", storeIds)
      .order("created_at", { ascending: false });

    const latest = new Map<string, Recommendation[]>();
    for (const row of audits ?? []) {
      if (!latest.has(row.store_id)) {
        latest.set(row.store_id, (row.recommendations ?? []) as Recommendation[]);
      }
    }

    byStore = (stores ?? [])
      .map((s) => ({
        storeId: s.id,
        storeName: s.shop_name ?? s.shopify_domain,
        recommendations: latest.get(s.id) ?? [],
      }))
      .filter((s) => s.recommendations.length > 0);
  }

  const totalSavings = byStore.reduce(
    (sum, s) =>
      sum + s.recommendations.reduce((r, rec) => r + rec.estimated_monthly_savings, 0),
    0
  );

  return (
    <div className="mx-auto max-w-4xl space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Recommendations</h1>
        <p className="text-sm text-muted-foreground">
          Prioritized actions to reduce your Shopify app spend.
        </p>
      </div>

      {byStore.length === 0 ? (
        <Card className="flex flex-col items-center justify-center py-16 text-center">
          <Lightbulb className="mb-4 h-10 w-10 text-muted-foreground" aria-hidden="true" />
          <CardTitle className="text-lg">No recommendations yet</CardTitle>
          <CardDescription className="mt-2 max-w-md">
            Run an audit on one of your stores to get personalized savings
            recommendations.
          </CardDescription>
          <Button asChild className="mt-6">
            <Link href="/dashboard">
              Go to dashboard
              <ArrowRight aria-hidden="true" />
            </Link>
          </Button>
        </Card>
      ) : (
        <>
          <Card className="border-success/40 bg-success/5">
            <CardContent className="flex items-center gap-4 py-6">
              <TrendingUp className="h-8 w-8 text-success" aria-hidden="true" />
              <div>
                <p className="text-2xl font-bold text-success">
                  {formatCurrency(totalSavings)}
                  <span className="text-base font-normal text-muted-foreground">
                    /mo potential
                  </span>
                </p>
                <p className="text-sm text-muted-foreground">
                  Across {byStore.length} store{byStore.length === 1 ? "" : "s"}.
                </p>
              </div>
            </CardContent>
          </Card>

          {byStore.map((store) => (
            <div key={store.storeId} className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold">{store.storeName}</h2>
                <Button asChild variant="outline" size="sm">
                  <Link href={`/audit/${store.storeId}`}>Open audit</Link>
                </Button>
              </div>
              <div className="space-y-3">
                {store.recommendations.map((rec) => {
                  const meta = TYPE_LABEL[rec.type];
                  return (
                    <Card key={`${rec.type}-${rec.app_id}`}>
                      <CardHeader className="flex flex-row items-start justify-between space-y-0">
                        <div className="flex items-start gap-3">
                          <TrendingUp
                            className="mt-0.5 h-5 w-5 text-muted-foreground"
                            aria-hidden="true"
                          />
                          <div>
                            <CardTitle className="flex items-center gap-2 text-base">
                              {rec.app_title}
                              <Badge variant={meta.variant}>{meta.label}</Badge>
                            </CardTitle>
                            <CardDescription className="mt-1">
                              {rec.message}
                            </CardDescription>
                            {rec.alternative && (
                              <p className="mt-2 text-sm">
                                <span className="font-medium">Alternative:</span>{" "}
                                {rec.alternative}
                              </p>
                            )}
                          </div>
                        </div>
                        <span className="shrink-0 rounded-md bg-success/10 px-2.5 py-1 text-sm font-semibold text-success">
                          +{formatCurrency(rec.estimated_monthly_savings)}/mo
                        </span>
                      </CardHeader>
                    </Card>
                  );
                })}
              </div>
            </div>
          ))}
        </>
      )}
    </div>
  );
}
