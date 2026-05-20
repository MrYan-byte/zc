import { Check, KeyRound, RotateCcw, Save, Wifi } from "lucide-react";
import { FormEvent, useEffect, useState } from "react";
import { DEFAULT_SETTINGS } from "../shared/defaults";
import type { AppSettings } from "../shared/types";
import { electronApi } from "./electronApi";

type SettingsWithKey = AppSettings & { hasApiKey: boolean };

export function SettingsWindow() {
  const [settings, setSettings] = useState<SettingsWithKey>({
    ...DEFAULT_SETTINGS,
    hasApiKey: false
  });
  const [apiKey, setApiKey] = useState("");
  const [status, setStatus] = useState("");
  const [isTesting, setIsTesting] = useState(false);

  useEffect(() => {
    electronApi.settings.get().then(setSettings);
  }, []);

  function patchSettings(patch: Partial<AppSettings>) {
    setSettings((current) => ({ ...current, ...patch }));
  }

  async function save(event?: FormEvent) {
    event?.preventDefault();
    const savedSettings = await electronApi.settings.save(settings);
    let keyStatus = { hasApiKey: savedSettings.hasApiKey };
    if (apiKey.trim()) {
      keyStatus = await electronApi.secrets.saveApiKey(apiKey);
      setApiKey("");
    }
    setSettings({ ...savedSettings, ...keyStatus });
    setStatus("已保存。");
  }

  async function clearKey() {
    const keyStatus = await electronApi.secrets.clearApiKey();
    setSettings((current) => ({ ...current, ...keyStatus }));
    setApiKey("");
    setStatus("Key 已清除。");
  }

  async function testConnection() {
    setIsTesting(true);
    setStatus("测试中...");
    const result = await electronApi.settings.testConnection();
    setStatus(result.message);
    setIsTesting(false);
  }

  async function toggleLaunchAtStartup(enabled: boolean) {
    const result = await electronApi.app.setLaunchAtStartup(enabled);
    setSettings(result);
  }

  return (
    <main className="panel-shell settings-shell">
      <header className="panel-header">
        <div>
          <h1>后台设置</h1>
          <p>{settings.hasApiKey ? "Key 已保存" : "未配置 Key"}</p>
        </div>
        <span className={`status-pill ${settings.hasApiKey ? "ok" : ""}`}>
          {settings.hasApiKey ? <Check size={16} /> : <KeyRound size={16} />}
          {settings.hasApiKey ? "Ready" : "Key"}
        </span>
      </header>

      <form className="settings-form" onSubmit={save}>
        <label>
          <span>OpenAI API Key</span>
          <input
            type="password"
            value={apiKey}
            onChange={(event) => setApiKey(event.target.value)}
            placeholder={settings.hasApiKey ? "已保存，输入新 Key 可覆盖" : "sk-..."}
          />
        </label>

        <label>
          <span>Base URL</span>
          <input
            value={settings.baseUrl}
            onChange={(event) => patchSettings({ baseUrl: event.target.value })}
          />
        </label>

        <label>
          <span>Model</span>
          <input
            value={settings.model}
            onChange={(event) => patchSettings({ model: event.target.value })}
          />
        </label>

        <label>
          <span>System Prompt / 人设</span>
          <textarea
            value={settings.systemPrompt}
            onChange={(event) => patchSettings({ systemPrompt: event.target.value })}
            rows={6}
          />
        </label>

        <div className="setting-grid">
          <label>
            <span>温度</span>
            <input
              min={0}
              max={2}
              step={0.1}
              type="number"
              value={settings.temperature}
              onChange={(event) =>
                patchSettings({ temperature: Number(event.target.value) })
              }
            />
          </label>

          <label>
            <span>最大输出</span>
            <input
              min={128}
              max={4096}
              step={64}
              type="number"
              value={settings.maxOutputTokens}
              onChange={(event) =>
                patchSettings({ maxOutputTokens: Number(event.target.value) })
              }
            />
          </label>
        </div>

        <label className="switch-row">
          <span>开机启动</span>
          <input
            type="checkbox"
            checked={settings.launchAtStartup}
            onChange={(event) => toggleLaunchAtStartup(event.target.checked)}
          />
        </label>

        {status ? <div className="status-line">{status}</div> : null}

        <div className="button-row">
          <button className="primary-button" type="submit">
            <Save size={18} />
            <span>保存</span>
          </button>
          <button
            className="secondary-button"
            type="button"
            onClick={testConnection}
            disabled={isTesting}
          >
            <Wifi size={18} />
            <span>{isTesting ? "测试中" : "测试连接"}</span>
          </button>
          <button className="secondary-button" type="button" onClick={clearKey}>
            <RotateCcw size={18} />
            <span>清除 Key</span>
          </button>
        </div>
      </form>
    </main>
  );
}
