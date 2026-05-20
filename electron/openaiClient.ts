import OpenAI from "openai";
import { randomUUID } from "node:crypto";
import type { BrowserWindow } from "electron";
import { buildResponseInput } from "../src/shared/chat";
import type {
  AppSettings,
  ChatMessage,
  ChatSendResult
} from "../src/shared/types";
import { getApiKey } from "./secrets";

export interface ChatDeps {
  getSettings(): AppSettings;
  getHistory(): ChatMessage[];
  saveHistory(history: ChatMessage[]): ChatMessage[];
  getResponseWindow(): BrowserWindow | null;
}

export async function sendChatMessage(
  userContent: string,
  deps: ChatDeps
): Promise<ChatSendResult> {
  const content = userContent.trim();
  if (!content) {
    return { ok: false, error: "请输入消息。" };
  }

  const apiKey = await getApiKey();
  if (!apiKey) {
    return { ok: false, error: "请先在设置里保存 OpenAI API Key。" };
  }

  const settings = deps.getSettings();
  const userMessage: ChatMessage = {
    id: randomUUID(),
    role: "user",
    content,
    createdAt: new Date().toISOString()
  };

  const historyWithUser = deps.saveHistory([...deps.getHistory(), userMessage]);
  const assistantMessage: ChatMessage = {
    id: randomUUID(),
    role: "assistant",
    content: "",
    createdAt: new Date().toISOString()
  };

  try {
    const client = new OpenAI({
      apiKey,
      baseURL: settings.baseUrl || undefined
    });

    const stream = await client.responses.create({
      model: settings.model,
      input: buildResponseInput(settings, historyWithUser, content),
      temperature: settings.temperature,
      max_output_tokens: settings.maxOutputTokens,
      stream: true
    });

    for await (const event of stream) {
      if (event.type === "response.output_text.delta") {
        assistantMessage.content += event.delta;
        deps.getResponseWindow()?.webContents.send("chat:delta", event.delta);
      }
    }

    const finalMessage: ChatMessage = {
      ...assistantMessage,
      content:
        assistantMessage.content.trim() ||
        "我刚才没有组织出有效回复，可以再问我一次。"
    };

    deps.saveHistory([...historyWithUser, finalMessage]);
    deps.getResponseWindow()?.webContents.send("chat:done", finalMessage);

    return {
      ok: true,
      message: finalMessage
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : "OpenAI 请求失败。";
    deps.getResponseWindow()?.webContents.send("chat:error", message);
    return {
      ok: false,
      error: message
    };
  }
}

export async function testOpenAiConnection(
  settings: AppSettings
): Promise<{ ok: boolean; message: string }> {
  const apiKey = await getApiKey();
  if (!apiKey) {
    return { ok: false, message: "还没有保存 OpenAI API Key。" };
  }

  try {
    const client = new OpenAI({
      apiKey,
      baseURL: settings.baseUrl || undefined
    });

    await client.responses.create({
      model: settings.model,
      input: "Reply with OK.",
      max_output_tokens: 16
    });

    return { ok: true, message: "连接成功。" };
  } catch (error) {
    return {
      ok: false,
      message: error instanceof Error ? error.message : "连接失败。"
    };
  }
}
