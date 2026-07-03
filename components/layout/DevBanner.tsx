"use client";

import * as React from "react";
import { AlertTriangle, X } from "lucide-react";
import { useTranslations } from "next-intl";

import { isSupabaseConfigured } from "@/lib/supabase/env";

const DISMISS_KEY = "cf-dev-banner-dismissed";

export function DevBanner() {
  const t = useTranslations("devBanner");
  const [dismissed, setDismissed] = React.useState(true);

  React.useEffect(() => {
    if (isSupabaseConfigured()) return;
    setDismissed(window.sessionStorage.getItem(DISMISS_KEY) === "1");
  }, []);

  if (isSupabaseConfigured() || dismissed) return null;

  function dismiss() {
    window.sessionStorage.setItem(DISMISS_KEY, "1");
    setDismissed(true);
  }

  return (
    <div
      role="status"
      className="flex items-start gap-3 border-b border-amber-500/30 bg-amber-500/10 px-4 py-2 text-sm text-amber-950 dark:text-amber-100"
    >
      <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
      <p className="flex-1">{t("message")}</p>
      <button
        type="button"
        onClick={dismiss}
        className="rounded-md p-1 hover:bg-amber-500/20"
        aria-label={t("dismiss")}
      >
        <X className="h-4 w-4" aria-hidden="true" />
      </button>
    </div>
  );
}
