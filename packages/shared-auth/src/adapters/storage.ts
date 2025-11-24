import type { StorageAdapter } from '../types';

/**
 * Storage adapter that must be implemented by the consuming app.
 *
 * For React Native (Expo):
 * - Use expo-secure-store for sensitive data
 * - Use @react-native-async-storage/async-storage for non-sensitive data
 *
 * For Web:
 * - Use localStorage or sessionStorage
 * - Consider using encrypted storage for sensitive data
 */

let storageAdapter: StorageAdapter | null = null;

/**
 * Set the storage adapter for the auth service
 */
export function setStorageAdapter(adapter: StorageAdapter): void {
  storageAdapter = adapter;
}

/**
 * Get the current storage adapter
 */
export function getStorageAdapter(): StorageAdapter {
  if (!storageAdapter) {
    throw new Error(
      'Storage adapter not initialized. Call setStorageAdapter() before using auth services.'
    );
  }
  return storageAdapter;
}

/**
 * Check if storage adapter is initialized
 */
export function isStorageInitialized(): boolean {
  return storageAdapter !== null;
}

/**
 * Create a localStorage-based storage adapter (for web)
 */
export function createLocalStorageAdapter(): StorageAdapter {
  return {
    async getItem<T = string>(key: string): Promise<T | null> {
      const value = localStorage.getItem(key);
      if (value === null) return null;
      try {
        return JSON.parse(value) as T;
      } catch {
        return value as T;
      }
    },
    async setItem(key: string, value: string): Promise<void> {
      localStorage.setItem(key, typeof value === 'string' ? value : JSON.stringify(value));
    },
    async removeItem(key: string): Promise<void> {
      localStorage.removeItem(key);
    },
  };
}

/**
 * Create an in-memory storage adapter (for testing)
 */
export function createMemoryStorageAdapter(): StorageAdapter {
  const storage = new Map<string, string>();

  return {
    async getItem<T = string>(key: string): Promise<T | null> {
      const value = storage.get(key);
      if (value === undefined) return null;
      try {
        return JSON.parse(value) as T;
      } catch {
        return value as T;
      }
    },
    async setItem(key: string, value: string): Promise<void> {
      storage.set(key, typeof value === 'string' ? value : JSON.stringify(value));
    },
    async removeItem(key: string): Promise<void> {
      storage.delete(key);
    },
  };
}
