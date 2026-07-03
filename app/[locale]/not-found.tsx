"use client";

import { AlertTriangle, Home, RefreshCw } from "lucide-react";
import { useTranslations } from "next-intl";

import { Link } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";

export default function LocaleNotFound() {
  const t = useTranslations("notFound");

  return (
    <div className="flex min-h-dvh flex-col items-center justify-center gap-6 bg-background px-4 text-center">
      <div className="grid h-14 w-14 place-items-center rounded-2xl bg-muted">
        <AlertTriangle className="h-7 w-7 text-muted-foreground" aria-hidden="true" />
      </div>
      <div className="space-y-2">
        <h1 className="text-3xl font-semibold tracking-tight">{t("title")}</h1>
        <p className="max-w-md text-sm text-muted-foreground">{t("description")}</p>
      </div>
      <Button asChild>
        <Link href="/dashboard">
          <Home className="h-4 w-4" aria-hidden="true" />
          {t("backHome")}
        </Link>
      </Button>
    </div>
  );
}
