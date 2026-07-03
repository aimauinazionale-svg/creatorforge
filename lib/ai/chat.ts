import { generateCompletion, type GroqMessage } from "@/lib/ai/groq";
import { getChannelConnectionCookie } from "@/lib/youtube/connection-store";

export type AppLocale = "en" | "it" | "es" | "de" | "fr" | "pt" | "ru" | "ja" | "zh";

export type ChatHistoryItem = {
  role: "user" | "assistant";
  content: string;
};

export type SendChatInput = {
  userMessage: string;
  history: ChatHistoryItem[];
  locale: AppLocale;
};

const LOCALE_NAMES: Record<AppLocale, string> = {
  en: "English",
  it: "Italian",
  es: "Spanish",
  de: "German",
  fr: "French",
  pt: "Portuguese",
  ru: "Russian",
  ja: "Japanese",
  zh: "Chinese",
};

const MAX_HISTORY_MESSAGES = 20;

function buildChannelContextBlock(): string | null {
  const channel = getChannelConnectionCookie();
  if (!channel) return null;

  const parts = [
    `Channel: ${channel.channelTitle}`,
    `Subscribers: ${channel.subscriberCount.toLocaleString()}`,
    `Total views: ${channel.viewCount.toLocaleString()}`,
    `Videos: ${channel.videoCount.toLocaleString()}`,
  ];
  if (channel.customUrl) parts.push(`Handle: ${channel.customUrl}`);
  return parts.join("\n");
}

function buildSystemPrompt(locale: AppLocale): string {
  const language = LOCALE_NAMES[locale];
  const channelBlock = buildChannelContextBlock();

  const channelSection = channelBlock
    ? `\n\nThe creator has a connected YouTube channel. Use this context when relevant:\n${channelBlock}`
    : "\n\nNo YouTube channel is connected yet. Encourage connecting their channel for personalized advice when helpful.";

  return `You are an expert YouTube creator coach and SEO/analytics specialist working inside CreatorForge.

Your role:
- Help creators grow with practical, actionable advice
- Expertise: CTR optimization, audience retention, keyword research, titles, thumbnails, descriptions, tags, posting schedules, competitor analysis, content strategy, and analytics interpretation
- Be concise but thorough; use bullet points when they improve clarity
- Give specific next steps the creator can apply today
- You can brainstorm video ideas, optimize titles/descriptions/tags, and plan growth strategies through conversation

Rules:
- ALWAYS respond in ${language} (locale: ${locale})
- Do not mention that you are an AI unless asked
- Do not fabricate channel statistics; only use connected channel data provided below
- If you lack information, ask one focused follow-up question${channelSection}`;
}

/**
 * Sends a chat turn to Groq with conversation history and expert persona.
 */
export async function sendChatCompletion(
  input: SendChatInput
): Promise<
  | { ok: true; data: { content: string } }
  | {
      ok: false;
      error: {
        code:
          | "RATE_LIMITED"
          | "UNAUTHENTICATED"
          | "MISSING_CONFIG"
          | "TIMEOUT"
          | "PROVIDER_ERROR"
          | "NETWORK_ERROR";
        details?: string;
      };
    }
> {
  const trimmedHistory = input.history.slice(-MAX_HISTORY_MESSAGES);
  const messages: GroqMessage[] = [
    { role: "system", content: buildSystemPrompt(input.locale) },
    ...trimmedHistory.map((m) => ({ role: m.role, content: m.content })),
    { role: "user", content: input.userMessage },
  ];

  const result = await generateCompletion(messages, {
    temperature: 0.7,
    maxTokens: 2048,
  });

  if (!result.ok) {
    return { ok: false, error: result.error };
  }

  return { ok: true, data: { content: result.data.content.trim() } };
}
