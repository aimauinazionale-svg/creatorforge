"use client";

import * as React from "react";
import { ThemeProvider as NextThemesProvider } from "next-themes";

export type ThemeProviderProps = React.ComponentProps<typeof NextThemesProvider>;

export function ThemeProvider(props: ThemeProviderProps) {
  return <NextThemesProvider {...props} />;
}

