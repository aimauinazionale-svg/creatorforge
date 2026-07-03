"use client";

import * as React from "react";
import { Check, Copy } from "lucide-react";
import { useTranslations } from "next-intl";

import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

export type CopyButtonProps = {
  value: string;
  label?: string;
  className?: string;
};

export function CopyButton({ value, label, className }: CopyButtonProps) {
  const t = useTranslations("common");
  const { toast } = useToast();
  const [copied, setCopied] = React.useState(false);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      toast({ title: t("actions.copied") });
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      toast({ variant: "destructive", title: t("toast.error") });
    }
  }

  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      className={className}
      onClick={() => void handleCopy()}
      aria-label={label ?? t("actions.copy")}
    >
      {copied ? (
        <Check className="h-4 w-4" aria-hidden="true" />
      ) : (
        <Copy className="h-4 w-4" aria-hidden="true" />
      )}
      <span>{copied ? t("actions.copied") : t("actions.copy")}</span>
    </Button>
  );
}
