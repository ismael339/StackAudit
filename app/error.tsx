"use client";

import { useEffect } from "react";
import { AlertTriangle, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Error reporting hook — integrate Sentry/Datadog here if needed
  }, [error]);

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center px-4 text-center">
      <AlertTriangle className="mb-4 h-12 w-12 text-destructive" aria-hidden="true" />
      <h2 className="text-xl font-semibold">Something went wrong</h2>
      <p className="mt-2 max-w-md text-sm text-muted-foreground">
        An unexpected error occurred. Try again — if the problem persists, contact
        support.
      </p>
      <Button onClick={reset} className="mt-6">
        <RotateCcw aria-hidden="true" />
        Try again
      </Button>
    </div>
  );
}
