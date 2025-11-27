/**
 * Centralized storage keys for AsyncStorage persistence
 *
 * Using a typed constant object prevents typos and makes it easy to:
 * - Find all storage keys in one place
 * - Refactor key names safely
 * - Maintain consistency across the app
 */
export const STORAGE_KEYS = {
  QUOTES: 'quotes-storage',
  LISTS: 'list-storage',
  SETTINGS: 'settings-storage',
  PREMIUM: 'premium-storage',
  ONBOARDING: 'onboarding-storage',
} as const;

// Type for storage keys
export type StorageKey = typeof STORAGE_KEYS[keyof typeof STORAGE_KEYS];
