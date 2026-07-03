import type { Metadata } from "next";

import "./globals.css";

import { buildMetadata } from "@/lib/metadata";

export const metadata: Metadata = buildMetadata();

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html suppressHydrationWarning className="overflow-x-hidden">
      <body className="min-h-dvh overflow-x-hidden bg-background font-sans text-foreground antialiased">
        {children}
      </body>
    </html>
  );
}
