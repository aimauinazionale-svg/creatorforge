"use client";

import { useTranslations } from "next-intl";

import { BrandLogo } from "@/components/brand/BrandLogo";
import { Link } from "@/i18n/navigation";
import { LanguageSwitcher } from "@/components/layout/LanguageSwitcher";

export function PublicFooter() {
  const t = useTranslations("landing.footer");

  const product = [
    { href: "/#features", label: t("links.features") },
    { href: "/#pricing", label: t("links.pricing") },
    { href: "/blog", label: t("links.blog") },
    { href: "/dashboard", label: t("links.login") },
  ] as const;

  const socials = [
    { href: "https://github.com", label: t("social.github") },
    { href: "https://x.com", label: t("social.x") },
    { href: "https://youtube.com", label: t("social.youtube") },
  ] as const;

  return (
    <footer className="border-t border-border/60 bg-background">
      <div className="mx-auto w-full max-w-6xl px-4 py-12 sm:px-6">
        <div className="grid gap-10 md:grid-cols-[1.2fr_1fr_1fr]">
          <div className="space-y-3">
            <Link href="/" aria-label={t("brand")}>
              <BrandLogo label={t("brand")} />
            </Link>
            <p className="max-w-sm text-sm text-muted-foreground">{t("tagline")}</p>
            <LanguageSwitcher />
          </div>

          <div className="space-y-3">
            <div className="text-sm font-semibold">{t("sections.product")}</div>
            <ul className="space-y-2 text-sm">
              {product.map((l) => (
                <li key={l.href}>
                  <Link href={l.href} className="inline-flex min-h-11 items-center text-muted-foreground hover:text-foreground">
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div className="space-y-3">
            <div className="text-sm font-semibold">{t("sections.social")}</div>
            <ul className="space-y-2 text-sm">
              {socials.map((s) => (
                <li key={s.href}>
                  <a
                    href={s.href}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex min-h-11 items-center text-muted-foreground hover:text-foreground"
                  >
                    {s.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="mt-10 flex flex-col gap-2 border-t border-border/60 pt-6 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
          <div>{t("copyright", { year: new Date().getFullYear() })}</div>
          <div className="flex flex-wrap gap-4">
            <Link href="/terms" className="inline-flex min-h-11 items-center hover:text-foreground">
              {t("legal.terms")}
            </Link>
            <Link href="/privacy" className="inline-flex min-h-11 items-center hover:text-foreground">
              {t("legal.privacy")}
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
