import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

// Supabase URL and anon key from environment variables
const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || '';

// Custom storage adapter for React Native
const AsyncStorageAdapter = {
  getItem: async (key: string) => {
    try {
      const item = await AsyncStorage.getItem(key);
      return item;
    } catch (error) {
      console.error('Error getting item from AsyncStorage:', error);
      return null;
    }
  },
  setItem: async (key: string, value: string) => {
    try {
      await AsyncStorage.setItem(key, value);
    } catch (error) {
      console.error('Error setting item in AsyncStorage:', error);
    }
  },
  removeItem: async (key: string) => {
    try {
      await AsyncStorage.removeItem(key);
    } catch (error) {
      console.error('Error removing item from AsyncStorage:', error);
    }
  },
};

// Create Supabase client with custom storage for React Native
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: Platform.OS === 'web' ? undefined : AsyncStorageAdapter,
    autoRefreshToken: false, // We handle auth through the backend
    persistSession: false, // We don't use Supabase auth directly
    detectSessionInUrl: false,
  },
});

// Helper function to set custom auth header
// This allows us to use our existing JWT tokens with Supabase client
export const setSupabaseAuthHeader = (token: string) => {
  // Update the auth header for all subsequent requests
  supabase.rest.headers['Authorization'] = `Bearer ${token}`;
};

// Storage helper functions for direct file operations
export const uploadToSupabaseStorage = async (
  bucket: string,
  path: string,
  file: File | Blob,
  options?: { contentType?: string; upsert?: boolean }
) => {
  const { data, error } = await supabase.storage
    .from(bucket)
    .upload(path, file, {
      contentType: options?.contentType || 'application/octet-stream',
      upsert: options?.upsert || false,
    });

  if (error) throw error;
  return data;
};

export const getPublicUrl = (bucket: string, path: string) => {
  const { data } = supabase.storage.from(bucket).getPublicUrl(path);
  return data.publicUrl;
};

// Real-time subscription helpers
export const subscribeToTable = (
  table: string,
  callback: (payload: any) => void,
  filter?: { column: string; value: string }
) => {
  const channel = supabase
    .channel(`${table}-changes`)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: table,
        ...(filter && { filter: `${filter.column}=eq.${filter.value}` }),
      },
      callback
    )
    .subscribe();

  return channel;
};

// Export types for TypeScript support
export type { SupabaseClient } from '@supabase/supabase-js';