"use client";

import * as React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { normalizeShopDomain, isValidShopDomain } from "@/lib/utils";

export function ConnectStoreDialog() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [open, setOpen] = React.useState(false);
  const [shop, setShop] = React.useState("");
  const [loading, setLoading] = React.useState(false);

  React.useEffect(() => {
    setOpen(searchParams.get("connect") === "1");
  }, [searchParams]);

  function handleOpenChange(next: boolean) {
    setOpen(next);
    if (!next) {
      const params = new URLSearchParams(searchParams.toString());
      params.delete("connect");
      router.replace(`/dashboard${params.size > 0 ? `?${params}` : ""}`, {
        scroll: false,
      });
    }
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const domain = normalizeShopDomain(shop);
    if (!isValidShopDomain(domain)) {
      toast.error("Enter a valid Shopify domain, e.g. mystore.myshopify.com");
      return;
    }
    setLoading(true);
    // Redirect to our OAuth starter; it handles limits + state
    window.location.href = `/api/shopify/auth?shop=${encodeURIComponent(domain)}`;
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Connect a Shopify store</DialogTitle>
          <DialogDescription>
            Enter your store&apos;s domain. You&apos;ll be redirected to Shopify to approve
            read-only access.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="shop-domain">Store domain</Label>
            <Input
              id="shop-domain"
              placeholder="mystore.myshopify.com"
              value={shop}
              onChange={(e) => setShop(e.target.value)}
              autoFocus
              required
            />
            <p className="text-xs text-muted-foreground">
              We only request the <code>read_apps</code> scope.
            </p>
          </div>
          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => handleOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="animate-spin" aria-hidden="true" />}
              Connect store
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
