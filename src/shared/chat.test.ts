import { describe, expect, it } from "vitest";
import { DEFAULT_SETTINGS } from "./defaults";
import { buildResponseInput, trimChatHistory } from "./chat";
import type { ChatMessage } from "./types";

function message(role: "user" | "assistant", content: string): ChatMessage {
  return {
    id: content,
    role,
    content,
    createdAt: "2026-05-20T00:00:00.000Z"
  };
}

describe("chat helpers", () => {
  it("builds a Responses API input with the system prompt and latest user message", () => {
    const input = buildResponseInput(
      DEFAULT_SETTINGS,
      [message("user", "你好"), message("assistant", "嗯。")],
      "今天状态如何？"
    );

    expect(input).toEqual([
      {
        role: "system",
        content: DEFAULT_SETTINGS.systemPrompt
      },
      {
        role: "user",
        content: "你好"
      },
      {
        role: "assistant",
        content: "嗯。"
      },
      {
        role: "user",
        content: "今天状态如何？"
      }
    ]);
  });

  it("limits the context sent to OpenAI", () => {
    const history = Array.from({ length: 16 }, (_, index) =>
      message(index % 2 === 0 ? "user" : "assistant", `m${index}`)
    );

    const input = buildResponseInput(DEFAULT_SETTINGS, history, "final", 4);

    expect(input.map((item) => item.content)).toEqual([
      DEFAULT_SETTINGS.systemPrompt,
      "m12",
      "m13",
      "m14",
      "m15",
      "final"
    ]);
  });

  it("trims persisted chat history", () => {
    const history = Array.from({ length: 5 }, (_, index) =>
      message("user", `m${index}`)
    );

    expect(trimChatHistory(history, 3).map((item) => item.content)).toEqual([
      "m2",
      "m3",
      "m4"
    ]);
  });
});
