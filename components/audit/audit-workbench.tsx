"use client";

import * as React from "react";
import Link from "next/link";
import { toast } from "sonner";
import { Loader2, PlayCircle, RefreshCw, Save, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { AppsTable, computeTotals } from "@/components/audit/apps-table";
import { createClient } from "@/lib/supabase/client";
import { analyzeApps } from "@/lib/audit";
import { formatCurrency, formatDateRelative } from "@/lib/utils";
import type { AppRecord, Recommendation } from "@/lib/types";

interface StoreInfo {
  id: string;
  shop_name: string | null;
  shopify_domain: string;
  last_synced_at: string | null;
}

interface AuditWorkbenchProps {
  store: StoreInfo;
  initialApps: AppRecord[];
}

interface AuditResponseData {
  audit: { id: string; created_at: string };
  apps: AppRecord[];
  totalMonthlyCost: number;
  potentialSavings: number;
  recommendations: Recommendation[];
}

export function AuditWorkbench({ store, initialApps }: AuditWorkbenchProps) {
  const [apps, setApps] = React.useState<AppRecord[]>(initialApps);
  const [syncing, setSyncing] = React.useState(false);
  const [saving, setSaving] = React.useState(false);
  const [hasUnsaved, setHasUnsaved] = React.useState(false);
  const [lastAuditAt, setLastAuditAt] = React.useState<string | null>(
    store.last_synced_at
  );

  // Live analysis from current app state
  const analysis = React.useMemo(() => analyzeApps(apps), [apps]);
  const totals = React.useMemo(() => computeTotals(apps), [apps]);

  function handleCostChange(appId: string, cost: number | null) {
    setApps((prev) =>
      prev.map((a) => (a.id === appId ? { ...a, monthly_cost: cost } : a))
    );
    setHasUnsaved(true);
  }

  function handleCategoryChange(appId: string, category: string) {
    setApps((prev) =>
      prev.map((a) => (a.id === appId ? { ...a, category } : a))
    );
    setHasUnsaved(true);
  }

  async function saveChanges(): Promise<boolean> {
    setSaving(true);
    try {
      const supabase = createClient();
      const updates = apps.map((a) => ({
        id: a.id,
        monthly_cost: a.monthly_cost,
        category: a.category,
      }));
      for (const u of updates) {
        const { error } = await supabase
          .from("apps")
          .update({ monthly_cost: u.monthly_cost, category: u.category })
          .eq("id", u.id);
        if (error) throw error;
      }
      setHasUnsaved(false);
      return true;
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to save";
      toast.error(msg);
      return false;
    } finally {
      setSaving(false);
    }
  }

  async function runAudit() {
    // Persist edits first so the audit reflects them
    const saved = await saveChanges();
    if (!saved) return;

    setSyncing(true);
    try {
      const res = await fetch("/api/audit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ storeId: store.id }),
      });
      const json = (await res.json()) as
        | { success: true; data: AuditResponseData }
        | { success: false; error: string; code?: string };

      if (!json.success) {
        if (json.code === "PLAN_LIMIT") {
          toast.error(json.error, {
            action: { label: "Upgrade", onClick: () => window.location.assign("/billing") },
          });
        } else if (json.code === "RECONNECT_REQUIRED") {
          toast.error(json.error, {
            action: {
              label: "Reconnect",
              onClick: () =>
                window.location.assign(
                  `/api/shopify/auth?shop=${encodeURIComponent(store.shopify_domain)}&storeId=${store.id}`
                ),
            },
          });
        } else {
          toast.error(json.error);
        }
        return;
      }

      setApps(json.data.apps);
      setLastAuditAt(json.data.audit.created_at);
      toast.success("Audit complete", {
        description: `Potential savings: ${formatCurrency(json.data.potentialSavings)}/mo`,
      });
    } catch {
      toast.error("Audit failed. Please try again.");
    } finally {
      setSyncing(false);
    }
  }

  if (initialApps.length === 0 && apps.length === 0 && !syncing) {
    return (
      <div className="mx-auto max-w-4xl space-y-6">
        <AuditHeader
          store={store}
          lastAuditAt={lastAuditAt}
          syncing={syncing}
          onRunAudit={runAudit}
        />
        <Card className="flex flex-col items-center justify-center py-16 text-center">
          <CardTitle className="text-lg">No apps found yet</CardTitle>
          <CardDescription className="mt-2 max-w-md">
            Run your first audit to pull every installed app from{" "}
            {store.shopify_domain} and start tracking costs.
          </CardDescription>
          <Button className="mt-6" onClick={runAudit} disabled={syncing}>
            {syncing ? (
              <Loader2 className="animate-spin" aria-hidden="true" />
            ) : (
              <PlayCircle aria-hidden="true" />
            )}
            Run first audit
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <AuditHeader
        store={store}
        lastAuditAt={lastAuditAt}
        syncing={syncing}
        onRunAudit={runAudit}
      />

      {/* Live summary */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Apps</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{totals.count}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total monthly cost</CardTitle>
          </CardHeader>
          <CardContent>
            {syncing ? (
              <Skeleton className="h-8 w-24" />
            ) : (
              <p className="text-2xl font-bold">{formatCurrency(totals.total)}</p>
            )}
          </CardContent>
        </Card>
        <Card className="border-success/40">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Potential savings</CardTitle>
          </CardHeader>
          <CardContent>
            {syncing ? (
              <Skeleton className="h-8 w-24" />
            ) : (
              <p className="text-2xl font-bold text-success">
                {formatCurrency(analysis.potentialSavings)}
                <span className="text-sm font-normal text-muted-foreground">/mo</span>
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Apps table */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0">
          <div>
            <CardTitle>Installed apps</CardTitle>
            <CardDescription>
              Edit costs and categories — totals update live.
            </CardDescription>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={saveChanges}
              disabled={saving || !hasUnsaved}
            >
              {saving ? (
                <Loader2 className="animate-spin" aria-hidden="true" />
              ) : (
                <Save aria-hidden="true" />
              )}
              Save
            </Button>
            <Button size="sm" onClick={runAudit} disabled={syncing}>
              {syncing ? (
                <Loader2 className="animate-spin" aria-hidden="true" />
              ) : (
                <RefreshCw aria-hidden="true" />
              )}
              Run new audit
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {syncing && apps.length === 0 ? (
            <div className="space-y-2">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : (
            <AppsTable
              apps={apps}
              redundantIds={analysis.redundantIds}
              onCostChange={handleCostChange}
              onCategoryChange={handleCategoryChange}
            />
          )}
        </CardContent>
      </Card>

      {/* Recommendations preview */}
      {analysis.recommendations.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Top recommendations</CardTitle>
            <CardDescription>
              {analysis.recommendations.length} action
              {analysis.recommendations.length === 1 ? "" : "s"} to cut costs.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {analysis.recommendations.slice(0, 4).map((rec) => (
              <div
                key={`${rec.type}-${rec.app_id}`}
                className="flex items-start justify-between gap-4 rounded-md border p-3"
              >
                <div>
                  <p className="text-sm font-medium">{rec.app_title}</p>
                  <p className="mt-0.5 text-sm text-muted-foreground">{rec.message}</p>
                </div>
                <span className="shrink-0 text-sm font-semibold text-success">
                  +{formatCurrency(rec.estimated_monthly_savings)}/mo
                </span>
              </div>
            ))}
            <Button asChild variant="link" className="px-0">
              <Link href="/recommendations">
                View all recommendations
                <ArrowRight aria-hidden="true" />
              </Link>
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function AuditHeader({
  store,
  lastAuditAt,
  syncing,
  onRunAudit,
}: {
  store: StoreInfo;
  lastAuditAt: string | null;
  syncing: boolean;
  onRunAudit: () => void;
}) {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">
          {store.shop_name ?? store.shopify_domain}
        </h1>
        <p className="text-sm text-muted-foreground">
          {store.shopify_domain}
          {lastAuditAt && ` · Last audit ${formatDateRelative(lastAuditAt)}`}
        </p>
      </div>
      <Button onClick={onRunAudit} disabled={syncing}>
        {syncing ? (
          <Loader2 className="animate-spin" aria-hidden="true" />
        ) : (
          <PlayCircle aria-hidden="true" />
        )}
        {syncing ? "Auditing…" : "Run new audit"}
      </Button>
    </div>
  );
}
