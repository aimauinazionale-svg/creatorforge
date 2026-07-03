"use client";

import * as React from "react";
import { useLocale, useTranslations } from "next-intl";

import { cn } from "@/lib/utils";
import { usePathname, useRouter } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export type SupportedLocale = "en" | "it" | "es" | "de" | "fr" | "pt" | "ru" | "ja" | "zh";

const SUPPORTED_LOCALES: Array<SupportedLocale> = ["en", "it", "es", "de", "fr", "pt", "ru", "ja", "zh"];

export type LanguageSwitcherProps = {
  className?: string;
};

export function LanguageSwitcher({ className }: LanguageSwitcherProps) {
  const t = useTranslations();
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          type="button"
          variant="outline"
          className={cn("h-9 px-3", className)}
          aria-label={t("layout.header.language")}
        >
          <span className="hidden sm:inline">{t(`layout.languages.${locale}`)}</span>
          <span className="sm:hidden">{t("layout.header.languageShort")}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        {SUPPORTED_LOCALES.map((l) => (
          <DropdownMenuItem
            key={l}
            onSelect={() => router.replace(pathname, { locale: l })}
            className={cn(l === locale ? "bg-accent text-accent-foreground" : undefined, "cursor-pointer")}
          >
            <span className="truncate">{t(`layout.languages.${l}`)}</span>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

