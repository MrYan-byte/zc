import type { AppSettings, ChatMessage } from "./types";

export interface ResponseInputMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export function buildResponseInput(
  settings: AppSettings,
  history: ChatMessage[],
  userMessage: string,
  historyLimit = 12
): ResponseInputMessage[] {
  const recentHistory = history
    .filter((item) => item.role === "user" || item.role === "assistant")
    .slice(-historyLimit)
    .map((item) => ({
      role: item.role as "user" | "assistant",
      content: item.content
    }));

  return [
    {
      role: "system",
      content: settings.systemPrompt
    },
    ...recentHistory,
    {
      role: "user",
      content: userMessage
    }
  ];
}

export function trimChatHistory(
  history: ChatMessage[],
  limit: number
): ChatMessage[] {
  if (history.length <= limit) {
    return history;
  }

  return history.slice(history.length - limit);
}
