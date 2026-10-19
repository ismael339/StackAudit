import Link from "next/link";
import { redirect } from "next/navigation";
import { Plus } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { DashboardNav } from "@/components/dashboard/dashboard-nav";
import { Logo } from "@/components/shared/logo";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export default async function DashboardLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?redirect=/dashboard");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("email, full_name, plan")
    .eq("id", user.id)
    .single();

  const plan = profile?.plan ?? "free";

  return (
    <div className="flex h-screen overflow-hidden bg-muted/30">
      {/* Desktop sidebar */}
      <div className="hidden md:block">
        <DashboardNav
          email={profile?.email ?? user.email ?? ""}
          fullName={profile?.full_name ?? null}
          plan={plan}
        />
      </div>

      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Mobile header */}
        <header className="flex items-center justify-between border-b bg-card px-4 py-3 md:hidden">
          <Logo href="/dashboard" />
          <div className="flex items-center gap-2">
            <Badge variant={plan === "pro" ? "success" : "secondary"}>
              {plan === "pro" ? "Pro" : "Free"}
            </Badge>
            <Button asChild size="sm" variant="outline">
              <Link href="/dashboard?connect=1">
                <Plus aria-hidden="true" />
                Connect
              </Link>
            </Button>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-4 md:p-8">{children}</main>
      </div>
    </div>
  );
}
