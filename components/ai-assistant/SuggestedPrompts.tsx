"use client";

import { useTranslations } from "next-intl";

import { Button } from "@/components/ui/button";

export type SuggestedPromptsProps = {
  onSelect: (prompt: string) => void;
  disabled?: boolean;
};

const PROMPT_KEYS = [
  "analyzeChannel",
  "videoIdeas",
  "optimizeTitle",
  "growthStrategy",
] as const;

export function SuggestedPrompts({ onSelect, disabled }: SuggestedPromptsProps) {
  const t = useTranslations("aiAssistant.chat.suggestions");

  return (
    <div className="space-y-3">
      <p className="text-sm font-medium text-muted-foreground">{t("title")}</p>
      <div className="flex flex-wrap gap-2">
        {PROMPT_KEYS.map((key) => (
          <Button
            key={key}
            type="button"
            variant="outline"
            size="sm"
            className="h-auto whitespace-normal rounded-full px-4 py-2 text-left text-xs sm:text-sm"
            disabled={disabled}
            onClick={() => onSelect(t(key))}
          >
            {t(key)}
          </Button>
        ))}
      </div>
    </div>
  );
}
