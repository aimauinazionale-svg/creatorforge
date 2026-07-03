"use client";

import * as React from "react";
import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { useTranslations } from "next-intl";

import { cn } from "@/lib/utils";

export type ThemeToggleProps = {
  className?: string;
};

export function ThemeToggle({ className }: ThemeToggleProps) {
  const t = useTranslations();
  const { resolvedTheme, setTheme } = useTheme();

  const isDark = resolvedTheme === "dark";

  return (
    <button
      type="button"
      className={cn(
        "inline-flex h-9 w-9 items-center justify-center rounded-md border border-border/60 bg-background text-foreground shadow-sm",
        "hover:bg-accent hover:text-accent-foreground",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
        "relative overflow-hidden",
        className
      )}
      aria-label={isDark ? t("theme.switchToLight") : t("theme.switchToDark")}
      onClick={() => setTheme(isDark ? "light" : "dark")}
    >
      <Sun
        className={cn(
          "h-4 w-4 transition-all duration-200",
          isDark ? "scale-0 rotate-90 opacity-0" : "scale-100 rotate-0 opacity-100"
        )}
        aria-hidden="true"
      />
      <Moon
        className={cn(
          "absolute h-4 w-4 transition-all duration-200",
          isDark ? "scale-100 rotate-0 opacity-100" : "scale-0 -rotate-90 opacity-0"
        )}
        aria-hidden="true"
      />
    </button>
  );
}

