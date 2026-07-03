"use client";

import { useEffect } from "react";

/**
 * Catches errors in the root layout. Must define its own html/body and
 * must not rely on context providers from the root layout.
 */
export default function GlobalError({
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
    <html lang="en">
      <body className="min-h-dvh bg-white font-sans text-gray-900 antialiased dark:bg-gray-950 dark:text-gray-50">
        <div className="flex min-h-dvh flex-col items-center justify-center gap-6 px-4 text-center">
          <h1 className="text-2xl font-semibold tracking-tight">Something went wrong</h1>
          <p className="max-w-md text-sm text-gray-600 dark:text-gray-400">
            An unexpected error occurred. Try refreshing the page.
          </p>
          <button
            type="button"
            onClick={reset}
            className="rounded-md bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-800 dark:bg-gray-100 dark:text-gray-900 dark:hover:bg-gray-200"
          >
            Try again
          </button>
        </div>
      </body>
    </html>
  );
}
