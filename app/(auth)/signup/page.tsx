import type { Metadata } from "next";
import { Suspense } from "react";
import { AuthForm } from "@/components/shared/auth-form";
import { Skeleton } from "@/components/ui/skeleton";

export const metadata: Metadata = {
  title: "Sign up",
  description: "Create a free StackAudit account and audit your Shopify app stack.",
};

export default function SignupPage() {
  return (
    <Suspense fallback={<Skeleton className="h-[540px] w-full" />}>
      <AuthForm mode="signup" />
    </Suspense>
  );
}
