import { AlertTriangle, Home } from "lucide-react";
import Link from "next/link";

import { Button } from "@/components/ui/button";

/** Root not-found (outside locale layout — no next-intl provider). */
export default function NotFound() {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center gap-6 bg-background px-4 text-center">
      <div className="grid h-14 w-14 place-items-center rounded-2xl bg-muted">
        <AlertTriangle className="h-7 w-7 text-muted-foreground" aria-hidden="true" />
      </div>
      <div className="space-y-2">
        <h1 className="text-3xl font-semibold tracking-tight">Page not found</h1>
        <p className="max-w-md text-sm text-muted-foreground">
          The page you are looking for does not exist or has been moved.
        </p>
      </div>
      <Button asChild>
        <Link href="/en">
          <Home className="h-4 w-4" aria-hidden="true" />
          Back to home
        </Link>
      </Button>
    </div>
  );
}
