import type { Metadata } from "next";
import { Suspense } from "react";
import { AuthForm } from "@/components/shared/auth-form";
import { Skeleton } from "@/components/ui/skeleton";

export const metadata: Metadata = {
  title: "Log in",
  description: "Log in to StackAudit to audit your Shopify app stack.",
};

export default function LoginPage() {
  return (
    <Suspense fallback={<Skeleton className="h-[480px] w-full" />}>
      <AuthForm mode="login" />
    </Suspense>
  );
}
