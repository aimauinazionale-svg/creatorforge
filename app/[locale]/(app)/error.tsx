"use client";

import { useEffect } from "react";

import { Button } from "@/components/ui/button";

/** App shell error boundary — no next-intl hooks (provider may be unavailable). */
export default function AppError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex min-h-[50vh] flex-col items-center justify-center gap-4 px-4 text-center">
      <h2 className="text-xl font-semibold">Something went wrong</h2>
      <p className="max-w-md text-sm text-muted-foreground">
        An unexpected error occurred. Try refreshing the page.
      </p>
      <Button type="button" onClick={reset}>
        Try again
      </Button>
    </div>
  );
}
