"use client";

import * as React from "react";
import {
  Calendar,
  ImageIcon,
  LayoutDashboard,
  Lightbulb,
  Search,
  Settings,
  Sparkles,
  Swords,
  Layers3,
  type LucideIcon,
} from "lucide-react";
import { useTranslations } from "next-intl";

import { BrandLogo } from "@/components/brand/BrandLogo";
import { Link, usePathname } from "@/i18n/navigation";

import { cn } from "@/lib/utils";

type NavItem = {
  href: string;
  icon: LucideIcon;
  labelKey: string;
};

const NAV_ITEMS: NavItem[] = [
  { href: "/dashboard", icon: LayoutDashboard, labelKey: "layout.nav.dashboard" },
  { href: "/ai-assistant", icon: Sparkles, labelKey: "layout.nav.aiAssistant" },
  { href: "/seo-lab", icon: Search, labelKey: "layout.nav.seoLab" },
  { href: "/competitors", icon: Swords, labelKey: "layout.nav.competitors" },
  { href: "/workflow", icon: Layers3, labelKey: "layout.nav.workflow" },
  { href: "/calendar", icon: Calendar, labelKey: "layout.nav.calendar" },
  { href: "/ideas", icon: Lightbulb, labelKey: "layout.nav.ideas" },
  { href: "/thumbnail", icon: ImageIcon, labelKey: "layout.nav.thumbnail" },
  { href: "/settings", icon: Settings, labelKey: "layout.nav.settings" },
];

function isActivePath(currentPath: string, href: string): boolean {
  if (href === "/") return currentPath === "/";
  return currentPath === href || currentPath.startsWith(`${href}/`);
}

function SidebarNav({ onNavigate }: { onNavigate?: () => void }) {
  const t = useTranslations();
  const pathname = usePathname();
  const current = pathname;

  return (
    <nav aria-label={t("layout.sidebar.navigation")} className="grid gap-1">
      {NAV_ITEMS.map((item) => {
        const Icon = item.icon;
        const active = isActivePath(current, item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onNavigate}
            className={cn(
              "group relative flex min-h-11 items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200",
              "hover:bg-accent hover:text-accent-foreground",
              active
                ? "bg-gradient-to-r from-violet-500/10 to-fuchsia-500/10 text-foreground shadow-sm"
                : "text-muted-foreground"
            )}
            aria-current={active ? "page" : undefined}
          >
            {active ? (
              <span
                className="absolute inset-y-1.5 left-0 w-0.5 rounded-full bg-gradient-to-b from-violet-500 to-fuchsia-500"
                aria-hidden="true"
              />
            ) : null}
            <Icon
              className={cn("h-4 w-4 shrink-0", active && "text-violet-600 dark:text-violet-400")}
              aria-hidden={true}
            />
            <span className="truncate">{t(item.labelKey)}</span>
          </Link>
        );
      })}
    </nav>
  );
}

function Logo() {
  const t = useTranslations();
  return (
    <Link
      href="/dashboard"
      className={cn(
        "inline-flex rounded-md",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      )}
      aria-label={t("layout.brand.name")}
    >
      <BrandLogo label={t("layout.brand.name")} size="md" />
    </Link>
  );
}

export type SidebarProps = {
  className?: string;
  onNavigate?: () => void;
  mobile?: boolean;
};

export function Sidebar({ className, onNavigate, mobile }: SidebarProps) {
  return (
    <aside
      className={cn(
        mobile ? "w-full" : "hidden md:fixed md:inset-y-0 md:z-30 md:flex md:w-64 md:flex-col",
        className
      )}
    >
      <div className="flex h-full flex-col border-r border-border/60 bg-background">
        <div className="flex h-16 items-center px-4">
          <Logo />
        </div>
        <div className="flex-1 overflow-y-auto px-3 pb-4">
          <SidebarNav onNavigate={onNavigate} />
        </div>
      </div>
    </aside>
  );
}
