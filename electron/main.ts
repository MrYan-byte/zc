import path from "node:path";
import { app, BrowserWindow, ipcMain, Menu, Tray, nativeImage } from "electron";
import { DEFAULT_PET_STATE } from "../src/shared/defaults";
import type {
  AppSettings,
  PetRuntimeState,
  PetState,
  RendererWindowKind
} from "../src/shared/types";
import { sendChatMessage, testOpenAiConnection } from "./openaiClient";
import { clearApiKey, hasApiKey, saveApiKey } from "./secrets";
import {
  getChatHistory,
  getPetWindowPosition,
  getSettings,
  saveChatHistory,
  savePetWindowPosition,
  saveSettings
} from "./store";

const isDev = !app.isPackaged;

let petWindow: BrowserWindow | null = null;
let settingsWindow: BrowserWindow | null = null;
let tray: Tray | null = null;
let runtimeState: PetRuntimeState = { ...DEFAULT_PET_STATE };

function getRendererUrl(kind: RendererWindowKind): string {
  const route = `#/${kind}`;
  if (isDev) {
    return `http://127.0.0.1:5173/${route}`;
  }

  return `file://${path.join(__dirname, "../dist/index.html")}${route}`;
}

function createPetWindow() {
  const position = getPetWindowPosition();
  petWindow = new BrowserWindow({
    width: 320,
    height: 520,
    x: position.x,
    y: position.y,
    transparent: true,
    frame: false,
    resizable: false,
    maximizable: false,
    fullscreenable: false,
    alwaysOnTop: true,
    skipTaskbar: true,
    hasShadow: false,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false
    }
  });

  petWindow.loadURL(getRendererUrl("pet"));
  petWindow.on("moved", () => {
    if (!petWindow) {
      return;
    }
    const bounds = petWindow.getBounds();
    savePetWindowPosition({ x: bounds.x, y: bounds.y });
  });
  petWindow.webContents.on("context-menu", () => {
    buildPetMenu().popup({ window: petWindow ?? undefined });
  });
  petWindow.on("closed", () => {
    petWindow = null;
  });
}

function createSettingsWindow() {
  if (settingsWindow) {
    return settingsWindow;
  }

  settingsWindow = new BrowserWindow({
    width: 520,
    height: 720,
    minWidth: 480,
    minHeight: 680,
    show: false,
    title: "ZC Pet Settings",
    backgroundColor: "#0f172a",
    autoHideMenuBar: true,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false
    }
  });

  settingsWindow.loadURL(getRendererUrl("settings"));
  settingsWindow.on("close", (event) => {
    event.preventDefault();
    settingsWindow?.hide();
  });
  return settingsWindow;
}

function openInlineChat() {
  petWindow?.show();
  petWindow?.focus();
  petWindow?.webContents.send("app:inlineChatOpen");
}

function buildPetMenu() {
  const settings = getSettings();
  return Menu.buildFromTemplate([
    {
      label: "聊天",
      click: () => openInlineChat()
    },
    {
      label: "设置",
      click: () => openSettingsWindow()
    },
    {
      label: runtimeState.paused ? "继续动画" : "暂停动画",
      click: () => {
        runtimeState = {
          ...runtimeState,
          paused: !runtimeState.paused
        };
        broadcastRuntimeState();
      }
    },
    {
      label: "开机启动",
      type: "checkbox",
      checked: settings.launchAtStartup,
      click: async (menuItem) => {
        await updateLaunchAtStartup(Boolean(menuItem.checked));
      }
    },
    { type: "separator" },
    {
      label: "退出",
      click: () => app.exit(0)
    }
  ]);
}

async function createTray() {
  const icon = nativeImage.createFromDataURL(buildTrayIconDataUrl());
  tray = new Tray(icon);
  tray.setToolTip("ZC Pet");
  tray.on("double-click", () => openInlineChat());
  tray.on("right-click", () => buildPetMenu().popup());
  tray.setContextMenu(buildPetMenu());
}

function buildTrayIconDataUrl(): string {
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 64 64">
      <rect width="64" height="64" rx="18" fill="#0f172a"/>
      <circle cx="32" cy="24" r="12" fill="#f8fafc"/>
      <path d="M20 46c3-8 9-12 12-12s9 4 12 12" fill="#94a3b8"/>
      <path d="M22 18l8-10 18 4-6 16" fill="#020617"/>
      <circle cx="28" cy="24" r="1.4" fill="#020617"/>
      <circle cx="36" cy="24" r="1.4" fill="#020617"/>
    </svg>
  `;
  return `data:image/svg+xml;base64,${Buffer.from(svg).toString("base64")}`;
}

function openSettingsWindow() {
  const window = createSettingsWindow();
  window.show();
  window.focus();
}

function broadcastRuntimeState() {
  petWindow?.webContents.send("pet:runtimeState", runtimeState);
}

async function updateLaunchAtStartup(enabled: boolean) {
  app.setLoginItemSettings({
    openAtLogin: enabled
  });
  const next = saveSettings({
    ...getSettings(),
    launchAtStartup: enabled
  });
  const result = { ...next, hasApiKey: await hasApiKey() };
  settingsWindow?.webContents.send("settings:updated", result);
  return result;
}

function normalizeSettings(settings: AppSettings): AppSettings {
  return {
    ...settings,
    baseUrl: settings.baseUrl.trim(),
    model: settings.model.trim(),
    systemPrompt: settings.systemPrompt.trim()
  };
}

function registerIpc() {
  ipcMain.handle("settings:get", async () => ({
    ...getSettings(),
    hasApiKey: await hasApiKey()
  }));

  ipcMain.handle("settings:save", async (_event, settings: AppSettings) => {
    const next = saveSettings(normalizeSettings(settings));
    if (next.launchAtStartup !== app.getLoginItemSettings().openAtLogin) {
      app.setLoginItemSettings({
        openAtLogin: next.launchAtStartup
      });
    }
    return {
      ...next,
      hasApiKey: await hasApiKey()
    };
  });

  ipcMain.handle("settings:testConnection", async () =>
    testOpenAiConnection(getSettings())
  );

  ipcMain.handle("secrets:saveApiKey", async (_event, apiKey: string) => ({
    hasApiKey: await saveApiKey(apiKey)
  }));

  ipcMain.handle("secrets:clearApiKey", async () => ({
    hasApiKey: await clearApiKey()
  }));

  ipcMain.handle("chat:history", () => getChatHistory());
  ipcMain.handle("chat:clear", () => saveChatHistory([]));

  ipcMain.handle("chat:send", async (_event, payload: { message: string }) => {
    runtimeState = { ...runtimeState, state: "loading" };
    broadcastRuntimeState();

    const result = await sendChatMessage(payload.message, {
      getSettings,
      getHistory: getChatHistory,
      saveHistory: saveChatHistory,
      getResponseWindow: () => petWindow
    });

    runtimeState = {
      ...runtimeState,
      state: result.ok ? "talk" : "angry"
    };
    broadcastRuntimeState();

    return result;
  });

  ipcMain.handle("pet:setState", (_event, state: PetState) => {
    runtimeState = {
      ...runtimeState,
      state
    };
    broadcastRuntimeState();
    return runtimeState;
  });

  ipcMain.handle("pet:getState", () => runtimeState);

  ipcMain.handle("pet:togglePaused", () => {
    runtimeState = {
      ...runtimeState,
      paused: !runtimeState.paused
    };
    broadcastRuntimeState();
    return runtimeState;
  });

  ipcMain.handle("app:openChat", async () => {
    openInlineChat();
  });

  ipcMain.handle("app:openSettings", async () => {
    openSettingsWindow();
  });

  ipcMain.handle("app:setLaunchAtStartup", async (_event, enabled: boolean) =>
    updateLaunchAtStartup(enabled)
  );
}

app.whenReady().then(async () => {
  createPetWindow();
  createSettingsWindow();
  await createTray();
  registerIpc();
  broadcastRuntimeState();

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createPetWindow();
    } else {
      petWindow?.show();
    }
  });
});

app.on("window-all-closed", () => {
  // Keep the tray app alive until the user chooses Exit.
});
