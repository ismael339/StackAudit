import { redirect } from "next/navigation";
import { Check } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { BillingActions } from "@/components/dashboard/billing-actions";
import { FREE_PLAN_LIMITS } from "@/lib/types";

export default async function BillingPage({
  searchParams,
}: {
  searchParams: Promise<{ success?: string; canceled?: string; error?: string }>;
}) {
  const { success, canceled, error } = await searchParams;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?redirect=/billing");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("plan")
    .eq("id", user.id)
    .single();

  const plan = profile?.plan ?? "free";
  const isPro = plan === "pro";

  return (
    <div className="mx-auto max-w-3xl space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Billing</h1>
        <p className="text-sm text-muted-foreground">
          Manage your subscription and plan limits.
        </p>
      </div>

      {success && (
        <div className="rounded-md border border-success/40 bg-success/10 p-4 text-sm text-success-foreground">
          🎉 Payment successful! Welcome to Pro. It may take a few seconds for your
          plan to update.
        </div>
      )}
      {canceled && (
        <div className="rounded-md border bg-muted/50 p-4 text-sm text-muted-foreground">
          Checkout canceled — you have not been charged.
        </div>
      )}
      {error === "store_limit_reached" && (
        <div className="rounded-md border border-warning/40 bg-warning/10 p-4 text-sm">
          Free plan is limited to {FREE_PLAN_LIMITS.max_stores} store. Upgrade to Pro
          to connect unlimited stores.
        </div>
      )}

      <div className="grid gap-6 md:grid-cols-2">
        {/* Free plan */}
        <Card className={ !isPro ? "border-primary" : "" }>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Free</CardTitle>
              {!isPro && <Badge>Current plan</Badge>}
            </div>
            <CardDescription>$0 /forever</CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm">
              <li className="flex items-center gap-2">
                <Check className="h-4 w-4 text-success" aria-hidden="true" />
                {FREE_PLAN_LIMITS.max_stores} store
              </li>
              <li className="flex items-center gap-2">
                <Check className="h-4 w-4 text-success" aria-hidden="true" />
                {FREE_PLAN_LIMITS.max_audits_per_month} audits per month
              </li>
              <li className="flex items-center gap-2">
                <Check className="h-4 w-4 text-success" aria-hidden="true" />
                Redundancy detection
              </li>
            </ul>
          </CardContent>
        </Card>

        {/* Pro plan */}
        <Card className={isPro ? "border-primary" : ""}>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Pro</CardTitle>
              {isPro && <Badge variant="success">Current plan</Badge>}
            </div>
            <CardDescription>$29/month or $290/year</CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm">
              {[
                "Unlimited stores",
                "Unlimited audits",
                "Full audit history",
                "Export to CSV",
                "Priority support",
              ].map((f) => (
                <li key={f} className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-success" aria-hidden="true" />
                  {f}
                </li>
              ))}
            </ul>
          </CardContent>
          <CardFooter>
            <BillingActions isPro={isPro} />
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
