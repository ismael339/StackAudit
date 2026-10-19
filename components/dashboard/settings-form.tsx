"use client";

import * as React from "react";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createClient } from "@/lib/supabase/client";

interface SettingsFormProps {
  email: string;
  fullName: string | null;
}

export function SettingsForm({ email, fullName }: SettingsFormProps) {
  const [name, setName] = React.useState(fullName ?? "");
  const [saving, setSaving] = React.useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSaving(true);
    try {
      const supabase = createClient();
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) throw new Error("Session expired");

      const { error } = await supabase
        .from("profiles")
        .update({ full_name: name })
        .eq("id", userData.user.id);
      if (error) throw error;

      toast.success("Profile updated");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to update profile");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-1.5">
        <Label htmlFor="settings-email">Email</Label>
        <Input id="settings-email" value={email} disabled aria-label="Email" />
        <p className="text-xs text-muted-foreground">
          Contact support to change your email address.
        </p>
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="settings-name">Full name</Label>
        <Input
          id="settings-name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Jane Doe"
        />
      </div>
      <Button type="submit" disabled={saving || name === (fullName ?? "")}>
        {saving && <Loader2 className="animate-spin" aria-hidden="true" />}
        Save changes
      </Button>
    </form>
  );
}
