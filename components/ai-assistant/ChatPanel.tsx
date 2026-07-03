"use client";

import * as React from "react";
import { Bot, Trash2 } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";

import { getChatRateLimitAction, sendChatMessageAction } from "@/app/actions/ai";
import { ChatInput } from "@/components/ai-assistant/ChatInput";
import { ChatMessage, ChatThinkingIndicator } from "@/components/ai-assistant/ChatMessage";
import { SuggestedPrompts } from "@/components/ai-assistant/SuggestedPrompts";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { callServerAction } from "@/lib/actions/call-action";
import { toUserFacingCode } from "@/lib/actions/result";
import { cn } from "@/lib/utils";
import type { ChatMessage as ChatMessageType } from "@/types/chat";

const STORAGE_KEY = "cf_ai_chat_messages";

function loadMessages(locale: string): ChatMessageType[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(`${STORAGE_KEY}_${locale}`);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (item): item is ChatMessageType =>
        item &&
        typeof item === "object" &&
        (item as ChatMessageType).role &&
        typeof (item as ChatMessageType).content === "string"
    );
  } catch {
    return [];
  }
}

function saveMessages(locale: string, messages: ChatMessageType[]): void {
  try {
    localStorage.setItem(`${STORAGE_KEY}_${locale}`, JSON.stringify(messages));
  } catch {
    // Ignore quota errors.
  }
}

function createUserMessage(content: string): ChatMessageType {
  return {
    id: crypto.randomUUID(),
    role: "user",
    content,
    createdAt: new Date().toISOString(),
  };
}

export function ChatPanel() {
  const t = useTranslations("aiAssistant.chat");
  const tErrors = useTranslations("aiAssistant.chat.errors");
  const locale = useLocale();
  const { toast } = useToast();

  const [messages, setMessages] = React.useState<ChatMessageType[]>([]);
  const [input, setInput] = React.useState("");
  const [isLoading, setIsLoading] = React.useState(false);
  const [hydrated, setHydrated] = React.useState(false);
  const [rateLimit, setRateLimit] = React.useState<{
    used: number;
    limit: number;
    remaining: number;
    nearLimit?: boolean;
  } | null>(null);

  const scrollRef = React.useRef<HTMLDivElement>(null);
  const bottomRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    setMessages(loadMessages(locale));
    setHydrated(true);
    void callServerAction(() => getChatRateLimitAction()).then((res) => {
      if (res.ok) {
        setRateLimit(res.data);
      }
    });
  }, [locale]);

  React.useEffect(() => {
    if (!hydrated) return;
    saveMessages(locale, messages);
  }, [messages, locale, hydrated]);

  React.useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  const handleCopy = React.useCallback(
    async (content: string) => {
      try {
        await navigator.clipboard.writeText(content);
        toast({ title: t("copied") });
      } catch {
        toast({ variant: "destructive", title: t("errors.GENERIC", { details: "" }) });
      }
    },
    [t, toast]
  );

  const sendMessage = React.useCallback(
    async (text: string) => {
      const trimmed = text.trim();
      if (!trimmed || isLoading) return;

      const userMessage = createUserMessage(trimmed);
      const history = [...messages, userMessage];
      setMessages(history);
      setInput("");
      setIsLoading(true);

      const res = await callServerAction(() =>
        sendChatMessageAction({
          message: trimmed,
          history: messages.map((m) => ({ role: m.role, content: m.content })),
          locale: locale as "en" | "it" | "es" | "de" | "fr" | "pt" | "ru" | "ja" | "zh",
        })
      );

      setIsLoading(false);

      if (!res.ok) {
        const code = toUserFacingCode(res.error.code);
        toast({
          variant: "destructive",
          title: tErrors(code, { details: res.error.details ?? "" }),
        });
        return;
      }

      setMessages((prev) => [...prev, res.data.message]);
      setRateLimit(res.data.rateLimit);
    },
    [isLoading, messages, locale, tErrors, toast]
  );

  const handleClear = () => {
    setMessages([]);
    try {
      localStorage.removeItem(`${STORAGE_KEY}_${locale}`);
    } catch {
      // Ignore.
    }
  };

  const showEmpty = hydrated && messages.length === 0 && !isLoading;

  return (
    <Card className="flex min-h-[calc(100dvh-11rem)] flex-col overflow-hidden border-border/60">
      <div className="flex items-center justify-between gap-2 border-b border-border/60 px-4 py-3">
        <div className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-primary">
            <Bot className="h-5 w-5" aria-hidden="true" />
          </div>
          <div>
            <p className="text-sm font-semibold">{t("expertName")}</p>
            <p className="text-xs text-muted-foreground">{t("expertTitle")}</p>
          </div>
        </div>
        {messages.length > 0 ? (
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button type="button" variant="ghost" size="sm" className="text-muted-foreground">
                <Trash2 className="mr-1.5 h-4 w-4" aria-hidden="true" />
                {t("clearChat")}
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>{t("clearConfirmTitle")}</AlertDialogTitle>
                <AlertDialogDescription>{t("clearConfirm")}</AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>{t("cancel")}</AlertDialogCancel>
                <AlertDialogAction onClick={handleClear}>{t("clearChat")}</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        ) : null}
      </div>

      {rateLimit?.nearLimit ? (
        <div className="border-b border-amber-500/20 bg-amber-500/5 px-4 py-2 text-xs text-amber-800 dark:text-amber-200">
          {t("rateLimit.nearDescription", {
            used: rateLimit.used,
            limit: rateLimit.limit,
            remaining: rateLimit.remaining,
          })}
        </div>
      ) : null}

      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto px-3 py-4 sm:px-4"
        role="log"
        aria-label={t("aria.messageList")}
      >
        {showEmpty ? (
          <div className="flex h-full min-h-[200px] flex-col items-center justify-center gap-6 px-2 text-center">
            <div className="space-y-2">
              <h2 className="text-lg font-semibold">{t("welcome")}</h2>
              <p className="max-w-md text-sm text-muted-foreground">{t("welcomeSubtitle")}</p>
            </div>
            <SuggestedPrompts onSelect={(prompt) => void sendMessage(prompt)} disabled={isLoading} />
          </div>
        ) : (
          <div className="space-y-4">
            {messages.map((message) => (
              <ChatMessage key={message.id} message={message} onCopy={handleCopy} />
            ))}
            {isLoading ? <ChatThinkingIndicator /> : null}
            <div ref={bottomRef} />
          </div>
        )}
      </div>

      {!showEmpty && messages.length === 0 && isLoading ? (
        <div className="px-4 pb-2">
          <ChatThinkingIndicator />
        </div>
      ) : null}

      {!showEmpty && messages.length > 0 && messages.length < 3 ? (
        <div className={cn("border-t border-border/40 px-4 py-3")}>
          <SuggestedPrompts
            onSelect={(prompt) => {
              setInput(prompt);
              void sendMessage(prompt);
            }}
            disabled={isLoading}
          />
        </div>
      ) : null}

      <ChatInput
        value={input}
        onChange={setInput}
        onSend={() => void sendMessage(input)}
        disabled={isLoading}
      />
    </Card>
  );
}
