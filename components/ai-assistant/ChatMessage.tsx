"use client";

import * as React from "react";
import { Bot, User } from "lucide-react";
import { useTranslations } from "next-intl";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { ChatMessage as ChatMessageType } from "@/types/chat";

export type ChatMessageProps = {
  message: ChatMessageType;
  onCopy?: (content: string) => void;
};

export function ChatMessage({ message, onCopy }: ChatMessageProps) {
  const t = useTranslations("aiAssistant.chat");
  const isUser = message.role === "user";

  return (
    <div
      className={cn("flex gap-3", isUser ? "flex-row-reverse" : "flex-row")}
      aria-label={isUser ? t("aria.userMessage") : t("aria.assistantMessage")}
    >
      <Avatar className="h-8 w-8 shrink-0">
        <AvatarFallback
          className={cn(
            "text-xs",
            isUser ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
          )}
        >
          {isUser ? <User className="h-4 w-4" aria-hidden="true" /> : <Bot className="h-4 w-4" aria-hidden="true" />}
        </AvatarFallback>
      </Avatar>

      <div
        className={cn(
          "group relative max-w-[85%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed sm:max-w-[75%]",
          isUser
            ? "bg-primary text-primary-foreground"
            : "border border-border/60 bg-muted/50 text-foreground"
        )}
      >
        <p className="whitespace-pre-wrap break-words">{message.content}</p>
        {!isUser && onCopy ? (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="mt-1 h-7 px-2 text-xs opacity-0 transition-opacity group-hover:opacity-100"
            onClick={() => onCopy(message.content)}
          >
            {t("copy")}
          </Button>
        ) : null}
      </div>
    </div>
  );
}

export function ChatThinkingIndicator() {
  const t = useTranslations("aiAssistant.chat");

  return (
    <div className="flex gap-3" aria-live="polite" aria-busy="true">
      <Avatar className="h-8 w-8 shrink-0">
        <AvatarFallback className="bg-muted text-muted-foreground">
          <Bot className="h-4 w-4" aria-hidden="true" />
        </AvatarFallback>
      </Avatar>
      <div className="flex items-center gap-2 rounded-2xl border border-border/60 bg-muted/50 px-4 py-3">
        <span className="sr-only">{t("thinking")}</span>
        <span className="flex gap-1" aria-hidden="true">
          <span className="h-2 w-2 animate-bounce rounded-full bg-muted-foreground/60 [animation-delay:-0.3s]" />
          <span className="h-2 w-2 animate-bounce rounded-full bg-muted-foreground/60 [animation-delay:-0.15s]" />
          <span className="h-2 w-2 animate-bounce rounded-full bg-muted-foreground/60" />
        </span>
        <span className="text-sm text-muted-foreground">{t("thinking")}</span>
      </div>
    </div>
  );
}
