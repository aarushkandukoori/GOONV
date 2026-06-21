export const IS_STATIC_DEPLOY = import.meta.env.VITE_STATIC === 'true';

export const API_KEY_STORAGE = 'goonv-openai-api-key';

export function getStoredApiKey(): string | null {
  try {
    return localStorage.getItem(API_KEY_STORAGE);
  } catch {
    return null;
  }
}

export function setStoredApiKey(key: string | null): void {
  try {
    if (key?.trim()) localStorage.setItem(API_KEY_STORAGE, key.trim());
    else localStorage.removeItem(API_KEY_STORAGE);
  } catch {
    /* ignore */
  }
}
