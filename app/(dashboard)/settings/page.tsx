import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { SettingsForm } from "@/components/dashboard/settings-form";
import { formatDate } from "@/lib/utils";

export default async function SettingsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?redirect=/settings");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("email, full_name, plan, created_at")
    .eq("id", user.id)
    .single();

  return (
    <div className="mx-auto max-w-2xl space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Settings</h1>
        <p className="text-sm text-muted-foreground">Manage your account details.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Profile</CardTitle>
          <CardDescription>Update your name and view account info.</CardDescription>
        </CardHeader>
        <CardContent>
          <SettingsForm
            email={profile?.email ?? user.email ?? ""}
            fullName={profile?.full_name ?? null}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Account</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-sm">
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Plan</span>
            <Badge variant={profile?.plan === "pro" ? "success" : "secondary"}>
              {profile?.plan === "pro" ? "Pro" : "Free"}
            </Badge>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Email</span>
            <span className="font-medium">{profile?.email ?? user.email}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Member since</span>
            <span className="font-medium">
              {profile?.created_at ? formatDate(profile.created_at) : "—"}
            </span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
