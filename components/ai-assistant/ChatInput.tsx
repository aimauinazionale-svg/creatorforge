"use client";

import * as React from "react";
import { Send } from "lucide-react";
import { useTranslations } from "next-intl";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

export type ChatInputProps = {
  value: string;
  onChange: (value: string) => void;
  onSend: () => void;
  disabled?: boolean;
  className?: string;
};

export function ChatInput({ value, onChange, onSend, disabled, className }: ChatInputProps) {
  const t = useTranslations("aiAssistant.chat");
  const textareaRef = React.useRef<HTMLTextAreaElement>(null);

  const handleKeyDown = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      if (!disabled && value.trim()) {
        onSend();
      }
    }
  };

  React.useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 160)}px`;
  }, [value]);

  return (
    <div
      className={cn(
        "flex items-end gap-2 border-t border-border/60 bg-background/95 p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] backdrop-blur supports-[backdrop-filter]:bg-background/80",
        className
      )}
    >
      <Textarea
        ref={textareaRef}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={t("placeholder")}
        disabled={disabled}
        rows={1}
        className="min-h-[44px] max-h-40 resize-none py-3"
        aria-label={t("placeholder")}
      />
      <Button
        type="button"
        size="icon"
        className="h-11 w-11 shrink-0"
        disabled={disabled || !value.trim()}
        onClick={onSend}
        aria-label={t("send")}
      >
        <Send className="h-4 w-4" aria-hidden="true" />
      </Button>
    </div>
  );
}
