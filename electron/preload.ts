import { contextBridge, ipcRenderer } from "electron";
import type {
  AppSettings,
  ChatMessage,
  ChatRequest,
  ChatSendResult,
  ConnectionTestResult,
  ElectronApi,
  PetRuntimeState,
  PetState
} from "../src/shared/types";

function onMessage<T>(channel: string, callback: (payload: T) => void) {
  const listener = (_event: Electron.IpcRendererEvent, payload: T) =>
    callback(payload);
  ipcRenderer.on(channel, listener);
  return () => ipcRenderer.removeListener(channel, listener);
}

const api: ElectronApi = {
  settings: {
    get: () => ipcRenderer.invoke("settings:get") as Promise<AppSettings & { hasApiKey: boolean }>,
    save: (settings: AppSettings) =>
      ipcRenderer.invoke("settings:save", settings) as Promise<
        AppSettings & { hasApiKey: boolean }
      >,
    testConnection: () =>
      ipcRenderer.invoke("settings:testConnection") as Promise<ConnectionTestResult>
  },
  secrets: {
    saveApiKey: (apiKey: string) =>
      ipcRenderer.invoke("secrets:saveApiKey", apiKey) as Promise<{ hasApiKey: boolean }>,
    clearApiKey: () =>
      ipcRenderer.invoke("secrets:clearApiKey") as Promise<{ hasApiKey: boolean }>
  },
  chat: {
    history: () => ipcRenderer.invoke("chat:history") as Promise<ChatMessage[]>,
    send: (request: ChatRequest) =>
      ipcRenderer.invoke("chat:send", request) as Promise<ChatSendResult>,
    clear: () => ipcRenderer.invoke("chat:clear") as Promise<ChatMessage[]>,
    onDelta: (callback) => onMessage<string>("chat:delta", callback),
    onDone: (callback) => onMessage<ChatMessage>("chat:done", callback),
    onError: (callback) => onMessage<string>("chat:error", callback)
  },
  pet: {
    setState: (state: PetState) =>
      ipcRenderer.invoke("pet:setState", state) as Promise<PetRuntimeState>,
    getState: () => ipcRenderer.invoke("pet:getState") as Promise<PetRuntimeState>,
    togglePaused: () => ipcRenderer.invoke("pet:togglePaused") as Promise<PetRuntimeState>,
    onRuntimeState: (callback) =>
      onMessage<PetRuntimeState>("pet:runtimeState", callback)
  },
  app: {
    openChat: () => ipcRenderer.invoke("app:openChat") as Promise<void>,
    openSettings: () => ipcRenderer.invoke("app:openSettings") as Promise<void>,
    setLaunchAtStartup: (enabled: boolean) =>
      ipcRenderer.invoke("app:setLaunchAtStartup", enabled) as Promise<
        AppSettings & { hasApiKey: boolean }
      >,
    onInlineChatOpen: (callback) =>
      onMessage<void>("app:inlineChatOpen", callback)
  }
};

contextBridge.exposeInMainWorld("electronApi", api);
