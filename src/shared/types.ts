export type ChatRole = "user" | "assistant" | "system";

export type PetState =
  | "idle"
  | "talk"
  | "think"
  | "listen"
  | "happy"
  | "angry"
  | "sleep"
  | "surprised"
  | "loading";

export interface AppSettings {
  baseUrl: string;
  model: string;
  systemPrompt: string;
  temperature: number;
  maxOutputTokens: number;
  launchAtStartup: boolean;
}

export interface ChatMessage {
  id: string;
  role: ChatRole;
  content: string;
  createdAt: string;
}

export interface ChatRequest {
  message: string;
}

export interface ChatSendResult {
  ok: boolean;
  message?: ChatMessage;
  error?: string;
}

export interface ConnectionTestResult {
  ok: boolean;
  message: string;
}

export interface PetRuntimeState {
  state: PetState;
  paused: boolean;
}

export interface ApiKeyStatus {
  hasApiKey: boolean;
}

export type RendererWindowKind = "pet" | "chat" | "settings";

export interface ElectronApi {
  settings: {
    get(): Promise<AppSettings & ApiKeyStatus>;
    save(settings: AppSettings): Promise<AppSettings & ApiKeyStatus>;
    testConnection(): Promise<ConnectionTestResult>;
  };
  secrets: {
    saveApiKey(apiKey: string): Promise<ApiKeyStatus>;
    clearApiKey(): Promise<ApiKeyStatus>;
  };
  chat: {
    history(): Promise<ChatMessage[]>;
    send(request: ChatRequest): Promise<ChatSendResult>;
    clear(): Promise<ChatMessage[]>;
    onDelta(callback: (delta: string) => void): () => void;
    onDone(callback: (message: ChatMessage) => void): () => void;
    onError(callback: (error: string) => void): () => void;
  };
  pet: {
    setState(state: PetState): Promise<PetRuntimeState>;
    getState(): Promise<PetRuntimeState>;
    togglePaused(): Promise<PetRuntimeState>;
    onRuntimeState(callback: (state: PetRuntimeState) => void): () => void;
  };
  app: {
    openChat(): Promise<void>;
    openSettings(): Promise<void>;
    setLaunchAtStartup(enabled: boolean): Promise<AppSettings & ApiKeyStatus>;
    onInlineChatOpen(callback: () => void): () => void;
  };
}
