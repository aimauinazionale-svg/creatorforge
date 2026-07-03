"use client";

import * as React from "react";
import { ThemeProvider as NextThemesProvider } from "next-themes";

import { Toaster } from "@/components/ui/toaster";

export type ProvidersProps = {
  children: React.ReactNode;
};

export function Providers({ children }: ProvidersProps) {
  return (
    <NextThemesProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
    >
      {children}
      <Toaster />
    </NextThemesProvider>
  );
}

