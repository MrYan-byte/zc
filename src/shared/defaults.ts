import type { AppSettings, PetRuntimeState } from "./types";

export const DEFAULT_SETTINGS: AppSettings = {
  baseUrl: "https://api.openai.com/v1",
  model: "gpt-5.4-mini",
  systemPrompt:
    "你是一个安静、冷静、略慵懒的桌宠伙伴。回复简洁、有陪伴感，默认使用中文。不要假装自己能发声或操控电脑。",
  temperature: 0.7,
  maxOutputTokens: 900,
  launchAtStartup: false
};

export const DEFAULT_PET_STATE: PetRuntimeState = {
  state: "idle",
  paused: false
};

export const CHAT_HISTORY_LIMIT = 80;
