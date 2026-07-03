"use client";

import * as React from "react";
import { ChevronRight, LogOut, User as UserIcon } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";

import { Link, usePathname } from "@/i18n/navigation";

import { cn } from "@/lib/utils";
import { LanguageSwitcher } from "@/components/layout/LanguageSwitcher";
import { GlobalSearch } from "@/components/layout/GlobalSearch";
import { MobileMenu } from "@/components/layout/MobileMenu";
import { ThemeToggle } from "@/components/layout/ThemeToggle";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

function stripLocalePrefix(pathname: string, locale: string): string {
  const re = new RegExp(`^/${locale}(?=/|$)`);
  const stripped = pathname.replace(re, "");
  return stripped.length === 0 ? "/" : stripped;
}

function segmentLabelKey(seg: string): string | null {
  switch (seg) {
    case "dashboard":
      return "layout.breadcrumb.dashboard";
    case "ai-assistant":
      return "layout.breadcrumb.aiAssistant";
    case "seo-lab":
      return "layout.breadcrumb.seoLab";
    case "competitors":
      return "layout.breadcrumb.competitors";
    case "workflow":
      return "layout.breadcrumb.workflow";
    case "calendar":
      return "layout.breadcrumb.calendar";
    case "ideas":
      return "layout.breadcrumb.ideas";
    case "thumbnail":
      return "layout.breadcrumb.thumbnail";
    case "settings":
      return "layout.breadcrumb.settings";
    case "onboarding":
      return "layout.breadcrumb.onboarding";
    default:
      return null;
  }
}

export type HeaderUser = {
  name?: string;
  email?: string;
  imageUrl?: string;
};

export type HeaderProps = {
  className?: string;
  user?: HeaderUser | null;
  onLogout?: () => void;
};

export function Header({ className, user, onLogout }: HeaderProps) {
  const t = useTranslations();
  const locale = useLocale();
  const pathname = usePathname();
  const current = stripLocalePrefix(pathname, locale);
  const segments = current.split("?")[0].split("#")[0].split("/").filter(Boolean);

  const breadcrumbItems = React.useMemo(() => {
    if (segments.length === 0) {
      return [{ href: "/dashboard", label: t("layout.breadcrumb.dashboard") }];
    }

    const items: Array<{ href: string; label: string; isDynamic?: boolean; dynamic?: string }> = [];
    let acc = "";
    for (const seg of segments) {
      acc += `/${seg}`;
      const key = segmentLabelKey(seg);
      if (key) {
        items.push({ href: acc, label: t(key) });
      } else {
        items.push({
          href: acc,
          label: t("layout.breadcrumb.dynamic", { segment: seg.replace(/-/g, " ") }),
          isDynamic: true,
          dynamic: seg,
        });
      }
    }
    return items;
  }, [segments, t]);

  const initials =
    (user?.name ?? user?.email ?? t("layout.user.initialFallback"))
      .trim()
      .slice(0, 1)
      .toUpperCase() || t("layout.user.initialFallback");

  const currentPageLabel = breadcrumbItems[breadcrumbItems.length - 1]?.label ?? t("layout.breadcrumb.dashboard");

  const avatarAlt = user?.name
    ? t("layout.user.avatarAlt", { name: user.name })
    : user?.email
      ? t("layout.user.avatarAlt", { name: user.email })
      : t("layout.user.guest");

  return (
    <header className={cn("flex h-16 items-center gap-2 border-b border-border/60 bg-background px-3 sm:gap-3 sm:px-4", className)}>
      <div className="shrink-0 md:hidden">
        <MobileMenu />
      </div>

      <nav
        aria-label={t("layout.header.breadcrumb")}
        className="flex min-w-0 flex-1 items-center gap-2 overflow-hidden"
      >
        <span className="truncate text-sm font-medium text-foreground md:hidden">{currentPageLabel}</span>
        <div className="hidden min-w-0 items-center gap-2 md:flex">
          {breadcrumbItems.map((item, idx) => {
            const isLast = idx === breadcrumbItems.length - 1;
            return (
              <React.Fragment key={item.href}>
                {idx > 0 ? <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden="true" /> : null}
                {isLast ? (
                  <span className="min-w-0 truncate text-sm font-medium text-foreground">{item.label}</span>
                ) : (
                  <Link
                    href={item.href}
                    className={cn(
                      "min-w-0 truncate rounded-md text-sm text-muted-foreground",
                      "hover:text-foreground",
                      "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    )}
                  >
                    {item.label}
                  </Link>
                )}
              </React.Fragment>
            );
          })}
        </div>
      </nav>

      <div className="hidden min-w-0 flex-1 justify-center px-2 md:flex">
        <GlobalSearch />
      </div>

      <div className="flex items-center gap-2">
        <LanguageSwitcher />
        <ThemeToggle />

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="outline"
              size="icon"
              className="h-11 w-11 rounded-full"
              aria-label={t("layout.header.userMenu")}
            >
              <Avatar className="h-8 w-8">
                {user?.imageUrl ? <AvatarImage src={user.imageUrl} alt={avatarAlt} /> : null}
                <AvatarFallback aria-hidden="true" className="text-xs font-semibold">
                  {initials}
                </AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel className="px-2 py-2">
              <div className="flex items-center gap-2">
                <UserIcon className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
                <div className="min-w-0">
                  <div className="truncate text-sm font-medium text-foreground">
                    {user?.name ? user.name : t("layout.user.guest")}
                  </div>
                  {user?.email ? (
                    <div className="truncate text-xs text-muted-foreground">{user.email}</div>
                  ) : null}
                </div>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onSelect={() => onLogout?.()} className="cursor-pointer">
              <LogOut className="h-4 w-4" aria-hidden="true" />
              <span>{t("layout.user.logout")}</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}

