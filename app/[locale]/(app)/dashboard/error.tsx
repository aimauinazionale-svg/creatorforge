"use client";

import { useEffect } from "react";

import { Button } from "@/components/ui/button";

/** Dashboard error boundary — no next-intl hooks (provider may be unavailable). */
export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[dashboard/error]", error);
  }, [error]);

  function handleRetry() {
    try {
      reset();
    } catch {
      window.location.reload();
    }
  }

  return (
    <div className="mx-auto max-w-lg space-y-4 rounded-xl border border-destructive/30 bg-destructive/10 p-6">
      <h2 className="text-lg font-semibold">Something went wrong</h2>
      <p className="text-sm text-muted-foreground">
        An unexpected error occurred. Try refreshing the page.
      </p>
      <div className="flex flex-wrap gap-2">
        <Button onClick={handleRetry}>Try again</Button>
        <Button variant="outline" onClick={() => window.location.reload()}>
          Refresh page
        </Button>
      </div>
    </div>
  );
}
