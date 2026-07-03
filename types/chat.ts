export type ChatMessageRole = "user" | "assistant";

export type ChatMessage = {
  role: ChatMessageRole;
  content: string;
  id: string;
  createdAt: string;
};
