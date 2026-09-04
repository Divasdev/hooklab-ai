/**
 * Safe local storage manager with quota exceed handling and type safety
 */

export function getStoredItem<T>(key: string, fallback: T): T {
  if (typeof window === 'undefined') return fallback;

  try {
    const raw = window.localStorage.getItem(key);
    if (raw === null) return fallback;
    return JSON.parse(raw) as T;
  } catch (error) {
    console.warn(`[Storage] Failed to read key "${key}":`, error);
    return fallback;
  }
}

export function setStoredItem<T>(key: string, value: T): boolean {
  if (typeof window === 'undefined') return false;

  try {
    const serialized = JSON.stringify(value);
    window.localStorage.setItem(key, serialized);
    return true;
  } catch (error) {
    console.error(`[Storage] Failed to write key "${key}":`, error);
    return false;
  }
}

export function removeStoredItem(key: string): void {
  if (typeof window === 'undefined') return;

  try {
    window.localStorage.removeItem(key);
  } catch (error) {
    console.warn(`[Storage] Failed to remove key "${key}":`, error);
  }
}
