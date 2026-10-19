"use client";

import * as React from "react";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatCurrency } from "@/lib/utils";
import type { AppRecord } from "@/lib/types";

export const APP_CATEGORIES = [
  "Reviews",
  "Email Marketing",
  "SEO",
  "Upsell & Cross-sell",
  "Page Builder",
  "Shipping & Delivery",
  "Trust & Security",
  "Loyalty & Rewards",
  "Popups & Bars",
  "Inventory Management",
  "Analytics",
  "Customer Support",
  "Print on Demand",
  "Currency Conversion",
  "Other",
] as const;

const EXPENSIVE_THRESHOLD = 30;

interface AppsTableProps {
  apps: AppRecord[];
  redundantIds: Set<string>;
  onCostChange: (appId: string, cost: number | null) => void;
  onCategoryChange: (appId: string, category: string) => void;
}

function statusFor(app: AppRecord, redundant: boolean): { label: string; variant: "success" | "warning" | "destructive" | "secondary" } {
  const cost = app.monthly_cost ?? 0;
  if (redundant) return { label: "Redundant", variant: "destructive" };
  if (cost >= EXPENSIVE_THRESHOLD) return { label: "Expensive", variant: "warning" };
  return { label: "OK", variant: "success" };
}

export function AppsTable({
  apps,
  redundantIds,
  onCostChange,
  onCategoryChange,
}: AppsTableProps) {
  const [localCosts, setLocalCosts] = React.useState<Record<string, string>>({});

  function handleCostInput(appId: string, value: string) {
    setLocalCosts((prev) => ({ ...prev, [appId]: value }));
    const parsed = value === "" ? null : Number(value);
    if (parsed === null || (!Number.isNaN(parsed) && parsed >= 0)) {
      onCostChange(appId, parsed);
    }
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>App</TableHead>
            <TableHead className="hidden sm:table-cell">Category</TableHead>
            <TableHead className="w-32">Monthly cost</TableHead>
            <TableHead className="w-24">Status</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {apps.map((app) => {
            const redundant = redundantIds.has(app.id);
            const status = statusFor(app, redundant);
            return (
              <TableRow key={app.id}>
                <TableCell>
                  <p className="font-medium">{app.title}</p>
                  <p className="text-xs text-muted-foreground">{app.handle}</p>
                </TableCell>
                <TableCell className="hidden sm:table-cell">
                  <Select
                    value={app.category ?? "Other"}
                    onValueChange={(v) => onCategoryChange(app.id, v)}
                  >
                    <SelectTrigger className="h-8 w-44 text-xs" aria-label={`Category for ${app.title}`}>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {APP_CATEGORIES.map((c) => (
                        <SelectItem key={c} value={c}>
                          {c}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </TableCell>
                <TableCell>
                  <div className="relative">
                    <span className="pointer-events-none absolute left-2 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
                      $
                    </span>
                    <Input
                      type="number"
                      min={0}
                      step="0.01"
                      inputMode="decimal"
                      aria-label={`Monthly cost for ${app.title}`}
                      className="h-8 pl-5 text-sm"
                      placeholder="0"
                      value={
                        localCosts[app.id] ??
                        (app.monthly_cost !== null ? String(app.monthly_cost) : "")
                      }
                      onChange={(e) => handleCostInput(app.id, e.target.value)}
                    />
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground sm:hidden">
                    {app.category ?? "Other"}
                  </p>
                </TableCell>
                <TableCell>
                  <Badge variant={status.variant}>{status.label}</Badge>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}

export function computeTotals(apps: AppRecord[]): {
  total: number;
  count: number;
} {
  return apps.reduce(
    (acc, a) => ({ total: acc.total + (a.monthly_cost ?? 0), count: acc.count + 1 }),
    { total: 0, count: 0 }
  );
}

export function formatCost(cost: number | null): string {
  return formatCurrency(cost ?? 0);
}
