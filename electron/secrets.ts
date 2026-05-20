import keytar from "keytar";

const SERVICE = "zc-pet";
const ACCOUNT = "openai-api-key";

let memoryApiKey = "";

export async function getApiKey(): Promise<string> {
  try {
    const stored = await keytar.getPassword(SERVICE, ACCOUNT);
    return stored ?? memoryApiKey;
  } catch {
    return memoryApiKey;
  }
}

export async function saveApiKey(apiKey: string): Promise<boolean> {
  const normalized = apiKey.trim();
  memoryApiKey = normalized;

  try {
    if (!normalized) {
      await keytar.deletePassword(SERVICE, ACCOUNT);
      return false;
    }

    await keytar.setPassword(SERVICE, ACCOUNT, normalized);
    return true;
  } catch {
    return Boolean(normalized);
  }
}

export async function clearApiKey(): Promise<boolean> {
  memoryApiKey = "";

  try {
    await keytar.deletePassword(SERVICE, ACCOUNT);
  } catch {
    // The in-memory fallback is already cleared.
  }

  return false;
}

export async function hasApiKey(): Promise<boolean> {
  return Boolean(await getApiKey());
}
