import Store from "electron-store";
import type { AppSettings, ChatMessage } from "../src/shared/types";
import {
  CHAT_HISTORY_LIMIT,
  DEFAULT_SETTINGS
} from "../src/shared/defaults";
import { trimChatHistory } from "../src/shared/chat";

interface StoreSchema {
  settings: AppSettings;
  chatHistory: ChatMessage[];
  petWindowBounds: {
    x?: number;
    y?: number;
  };
}

const store = new Store<StoreSchema>({
  name: "zc-pet",
  defaults: {
    settings: DEFAULT_SETTINGS,
    chatHistory: [],
    petWindowBounds: {}
  }
});

export function getSettings(): AppSettings {
  return {
    ...DEFAULT_SETTINGS,
    ...store.get("settings")
  };
}

export function saveSettings(settings: AppSettings): AppSettings {
  const nextSettings = {
    ...DEFAULT_SETTINGS,
    ...settings,
    temperature: clamp(settings.temperature, 0, 2),
    maxOutputTokens: Math.max(128, Math.floor(settings.maxOutputTokens))
  };

  store.set("settings", nextSettings);
  return nextSettings;
}

export function getChatHistory(): ChatMessage[] {
  return store.get("chatHistory") ?? [];
}

export function saveChatHistory(history: ChatMessage[]): ChatMessage[] {
  const trimmed = trimChatHistory(history, CHAT_HISTORY_LIMIT);
  store.set("chatHistory", trimmed);
  return trimmed;
}

export function clearChatHistory(): ChatMessage[] {
  store.set("chatHistory", []);
  return [];
}

export function getPetWindowPosition(): { x?: number; y?: number } {
  return store.get("petWindowBounds") ?? {};
}

export function savePetWindowPosition(position: {
  x?: number;
  y?: number;
}): void {
  store.set("petWindowBounds", position);
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, Number.isFinite(value) ? value : min));
}
