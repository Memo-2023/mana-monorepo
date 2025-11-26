import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';
import { Platform } from 'react-native';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || '';

// Log error if env vars are missing but don't crash
if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing Supabase environment variables:', {
    url: !!supabaseUrl,
    key: !!supabaseAnonKey,
  });
}

// Create a custom storage adapter that works on both web and mobile
const storage = Platform.select({
  web: {
    getItem: async (key: string) => {
      if (typeof window !== 'undefined' && window.localStorage) {
        return window.localStorage.getItem(key);
      }
      return null;
    },
    setItem: async (key: string, value: string) => {
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.setItem(key, value);
      }
    },
    removeItem: async (key: string) => {
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.removeItem(key);
      }
    },
  },
  default: AsyncStorage,
});

export const supabase = createClient(
  supabaseUrl || 'https://placeholder.supabase.co',
  supabaseAnonKey || 'placeholder-key',
  {
    auth: {
      storage: storage as any,
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: false,
    },
  }
);

/**
 * Create a Supabase client with Mana Core authentication token
 * Use this when you need to make authenticated requests to Supabase
 * that respect Row-Level Security (RLS) policies based on Mana user
 */
export const getSupabaseWithManaToken = async (manaToken: string) => {
  return createClient(
    supabaseUrl || 'https://placeholder.supabase.co',
    supabaseAnonKey || 'placeholder-key',
    {
      global: {
        headers: {
          Authorization: `Bearer ${manaToken}`,
        },
      },
      auth: {
        storage: storage as any,
        autoRefreshToken: false, // Don't auto-refresh Mana tokens here
        persistSession: false,
        detectSessionInUrl: false,
      },
    }
  );
};

/**
 * Helper to get authenticated Supabase client with current Mana token
 * Automatically refreshes token if expired or close to expiry
 */
export const getAuthenticatedSupabase = async () => {
  const { safeStorage } = await import('./safeStorage');
  const { authService } = await import('../services/authService');

  let manaToken = await safeStorage.getItem<string>('@mana/appToken');

  if (!manaToken) {
    throw new Error('No Mana authentication token found');
  }

  // Check if token is expired or close to expiry
  const isValid = authService.isTokenValidLocally(manaToken);

  if (!isValid) {
    // Token is expired or close to expiry, try to refresh
    try {
      const refreshToken = await safeStorage.getItem<string>('@mana/refreshToken');

      if (!refreshToken) {
        throw new Error('No refresh token available');
      }

      const tokens = await authService.refreshTokens(refreshToken);
      manaToken = tokens.appToken;
    } catch (error) {
      console.error('Failed to refresh token:', error);
      // Clear auth storage and notify auth store
      await authService.clearAuthStorage();
      // Import at runtime to avoid circular dependency
      const { useAuthStore } = await import('../store/authStore');
      useAuthStore.setState({ user: null });
      throw new Error('Authentication token expired. Please sign in again.');
    }
  }

  return getSupabaseWithManaToken(manaToken);
};
