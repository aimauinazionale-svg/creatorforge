"use client";

import * as React from "react";
import { AlertTriangle, LogIn, RefreshCw, Tv } from "lucide-react";
import { useTranslations } from "next-intl";

import { Link } from "@/i18n/navigation";
import type { ActionErrorCode } from "@/lib/actions/result";
import { Button } from "@/components/ui/button";

export type ActionErrorAlertProps = {
  code: ActionErrorCode | string;
  details?: string;
  onRetry?: () => void;
  className?: string;
};

function isYouTubeNotConnected(code: string): boolean {
  return code === "YOUTUBE_NOT_CONNECTED" || code === "NOT_CONNECTED";
}

function isRetryable(code: string): boolean {
  return (
    code === "NETWORK" ||
    code === "UNKNOWN" ||
    code === "DB_ERROR" ||
    code === "PROVIDER_ERROR" ||
    code === "INTERNAL" ||
    code === "TIMEOUT" ||
    code === "INVALID_JSON" ||
    code === "MISSING_CONFIG"
  );
}

function messageKey(code: string): string {
  if (isYouTubeNotConnected(code)) return "common.errors.YOUTUBE_NOT_CONNECTED";
  if (
    code === "NETWORK" ||
    code === "UNKNOWN" ||
    code === "DB_ERROR" ||
    code === "AUTH_ERROR" ||
    code === "MISSING_CONFIG" ||
    code === "TIMEOUT" ||
    code === "INVALID_JSON"
  ) {
    return `common.errors.${code}`;
  }
  if (
    code === "UNAUTHENTICATED" ||
    code === "RATE_LIMITED" ||
    code === "INVALID_INPUT" ||
    code === "NOT_FOUND"
  ) {
    return `common.errors.${code}`;
  }
  return "common.errors.UNKNOWN";
}

export function ActionErrorAlert({ code, details, onRetry, className }: ActionErrorAlertProps) {
  const t = useTranslations();
  const message = t(messageKey(code), { details: details ?? "" });

  return (
    <div
      role="alert"
      className={
        className ??
        "flex flex-col gap-3 rounded-xl border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive"
      }
    >
      <div className="flex items-start gap-2">
        <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
        <p>{message}</p>
      </div>
      <div className="flex flex-wrap gap-2">
        {code === "UNAUTHENTICATED" ? (
          <Button asChild size="sm" variant="outline">
            <Link href="/login">
              <LogIn className="h-4 w-4" aria-hidden="true" />
              {t("common.actions.signIn")}
            </Link>
          </Button>
        ) : null}
        {isYouTubeNotConnected(code) ? (
          <Button asChild size="sm" variant="outline">
            <Link href="/settings">
              <Tv className="h-4 w-4" aria-hidden="true" />
              {t("common.actions.connectYouTube")}
            </Link>
          </Button>
        ) : null}
        {isRetryable(code) && onRetry ? (
          <Button type="button" size="sm" variant="outline" onClick={onRetry}>
            <RefreshCw className="h-4 w-4" aria-hidden="true" />
            {t("common.actions.retry")}
          </Button>
        ) : null}
      </div>
    </div>
  );
}
