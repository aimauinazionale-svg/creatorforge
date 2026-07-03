"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { ArrowRight, Menu } from "lucide-react";

import { BrandLogo } from "@/components/brand/BrandLogo";
import { Link } from "@/i18n/navigation";
import { LanguageSwitcher } from "@/components/layout/LanguageSwitcher";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";

export function PublicHeader() {
  const t = useTranslations("landing");
  const [open, setOpen] = useState(false);

  const nav = [
    { href: "/#features", label: t("nav.features") },
    { href: "/pricing", label: t("nav.pricing") },
    { href: "/blog", label: t("nav.blog") },
    { href: "/login", label: t("nav.login") },
  ] as const;

  return (
    <header className="sticky top-0 z-50 border-b border-border/60 bg-background/80 backdrop-blur">
      <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
        <Link href="/" className="min-w-0 shrink" aria-label={t("brand")}>
          <BrandLogo label={t("brand")} showText textClassName="hidden sm:inline" />
        </Link>

        <nav className="hidden items-center gap-6 md:flex" aria-label={t("nav.aria")}>
          {nav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="text-sm font-medium text-muted-foreground hover:text-foreground"
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <LanguageSwitcher className="hidden sm:inline-flex" />

          <Button asChild className="hidden gap-2 sm:inline-flex">
            <Link href="/register">
              {t("cta.getStartedFree")}
              <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>

          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
              <Button
                type="button"
                variant="outline"
                size="icon"
                className="h-11 w-11 md:hidden"
                aria-label={t("nav.menuOpen")}
              >
                <Menu className="h-5 w-5" aria-hidden="true" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" closeLabel={t("nav.close")} className="w-[min(100vw-2rem,18rem)]">
              <div className="mt-8 flex flex-col gap-6">
                <BrandLogo label={t("brand")} size="lg" />
                <nav className="grid gap-1" aria-label={t("nav.aria")}>
                  {nav.map((item) => (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setOpen(false)}
                      className="min-h-11 rounded-lg px-3 py-2.5 text-sm font-medium text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                    >
                      {item.label}
                    </Link>
                  ))}
                </nav>
                <LanguageSwitcher />
                <Button asChild className="min-h-11 gap-2">
                  <Link href="/register" onClick={() => setOpen(false)}>
                    {t("cta.getStartedFree")}
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </Button>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
