"use client";

import * as React from "react";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ChevronDown } from "lucide-react";

interface BillingActionsProps {
  isPro: boolean;
}

async function postJSON(url: string, body?: object): Promise<string> {
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: body ? JSON.stringify(body) : undefined,
  });
  const json = (await res.json()) as
    | { success: true; data: { url: string } }
    | { success: false; error: string };
  if (!json.success) throw new Error(json.error);
  return json.data.url;
}

export function BillingActions({ isPro }: BillingActionsProps) {
  const [loading, setLoading] = React.useState<"monthly" | "yearly" | "portal" | null>(null);

  async function startCheckout(interval: "monthly" | "yearly") {
    setLoading(interval);
    try {
      const url = await postJSON("/api/stripe/checkout", { interval });
      window.location.assign(url);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Checkout failed");
      setLoading(null);
    }
  }

  async function openPortal() {
    setLoading("portal");
    try {
      const url = await postJSON("/api/stripe/portal");
      window.location.assign(url);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not open billing portal");
      setLoading(null);
    }
  }

  if (isPro) {
    return (
      <Button className="w-full" variant="outline" onClick={openPortal} disabled={loading !== null}>
        {loading === "portal" && <Loader2 className="animate-spin" aria-hidden="true" />}
        Manage subscription
      </Button>
    );
  }

  return (
    <div className="flex w-full gap-2">
      <Button
        className="flex-1"
        onClick={() => startCheckout("monthly")}
        disabled={loading !== null}
      >
        {loading === "monthly" && <Loader2 className="animate-spin" aria-hidden="true" />}
        Upgrade monthly
      </Button>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" className="flex-1" disabled={loading !== null}>
            Yearly
            <ChevronDown className="h-4 w-4" aria-hidden="true" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={() => startCheckout("yearly")}>
            $290/year — save 17%
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
