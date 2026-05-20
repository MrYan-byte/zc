import { DEFAULT_PET_STATE, DEFAULT_SETTINGS } from "../shared/defaults";
import type { ChatMessage, ElectronApi } from "../shared/types";

let mockHistory: ChatMessage[] = [];

const mockApi: ElectronApi = {
  settings: {
    async get() {
      return {
        ...DEFAULT_SETTINGS,
        hasApiKey: false
      };
    },
    async save(settings) {
      return {
        ...settings,
        hasApiKey: false
      };
    },
    async testConnection() {
      return {
        ok: false,
        message: "浏览器预览模式下不可测试连接。"
      };
    }
  },
  secrets: {
    async saveApiKey() {
      return { hasApiKey: true };
    },
    async clearApiKey() {
      return { hasApiKey: false };
    }
  },
  chat: {
    async history() {
      return mockHistory;
    },
    async send({ message }) {
      const response: ChatMessage = {
        id: crypto.randomUUID(),
        role: "assistant",
        content: `预览模式收到：${message}`,
        createdAt: new Date().toISOString()
      };
      mockHistory = [...mockHistory, response];
      return {
        ok: true,
        message: response
      };
    },
    async clear() {
      mockHistory = [];
      return [];
    },
    onDelta() {
      return () => undefined;
    },
    onDone() {
      return () => undefined;
    },
    onError() {
      return () => undefined;
    }
  },
  pet: {
    async setState(state) {
      return { state, paused: false };
    },
    async getState() {
      return DEFAULT_PET_STATE;
    },
    async togglePaused() {
      return DEFAULT_PET_STATE;
    },
    onRuntimeState() {
      return () => undefined;
    }
  },
  app: {
    async openChat() {
      window.location.hash = "#/pet";
    },
    async openSettings() {
      window.location.hash = "#/settings";
    },
    async setLaunchAtStartup() {
      return {
        ...DEFAULT_SETTINGS,
        hasApiKey: false
      };
    },
    async beginPetDrag() {
      return undefined;
    },
    async dragPetTo() {
      return undefined;
    },
    async endPetDrag() {
      return undefined;
    },
    onInlineChatOpen() {
      return () => undefined;
    }
  }
};

export const electronApi = window.electronApi ?? mockApi;
