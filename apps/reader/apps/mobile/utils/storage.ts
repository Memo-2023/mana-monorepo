import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

// Platform-specific storage adapter for Supabase
const createStorage = () => {
  // For web/SSR environments, use a no-op storage or localStorage
  if (Platform.OS === 'web') {
    // Check if we're in a browser environment
    if (typeof window !== 'undefined' && window.localStorage) {
      return {
        getItem: async (key: string) => window.localStorage.getItem(key),
        setItem: async (key: string, value: string) => window.localStorage.setItem(key, value),
        removeItem: async (key: string) => window.localStorage.removeItem(key),
      };
    } else {
      // SSR environment - return no-op storage
      return {
        getItem: async () => null,
        setItem: async () => {},
        removeItem: async () => {},
      };
    }
  }

  // For native platforms, use AsyncStorage
  return AsyncStorage;
};

export const storage = createStorage();
