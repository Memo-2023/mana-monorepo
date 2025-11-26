import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';
import { Platform } from 'react-native';
import type { Database } from '@picture/shared/types';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || 'https://mjuvnnjxwfwlmxjsgkqu.supabase.co';
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1qdXZubmp4d2Z3bG14anNna3F1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTYyNTg5NTUsImV4cCI6MjA3MTgzNDk1NX0.EeOKzyPnZ42zpFl7oi54qDcAZSW-XGoB0tSNwUiX9GU';

// Create a storage adapter that works for both web and mobile
const createStorage = () => {
  if (Platform.OS === 'web') {
    // For web, use a simple localStorage wrapper
    return {
      getItem: async (key: string) => {
        try {
          if (typeof window !== 'undefined' && window.localStorage) {
            const item = window.localStorage.getItem(key);
            return item;
          }
        } catch (error) {
          console.error('Error getting item from localStorage:', error);
        }
        return null;
      },
      setItem: async (key: string, value: string) => {
        try {
          if (typeof window !== 'undefined' && window.localStorage) {
            window.localStorage.setItem(key, value);
          }
        } catch (error) {
          console.error('Error setting item in localStorage:', error);
        }
      },
      removeItem: async (key: string) => {
        try {
          if (typeof window !== 'undefined' && window.localStorage) {
            window.localStorage.removeItem(key);
          }
        } catch (error) {
          console.error('Error removing item from localStorage:', error);
        }
      },
    };
  }
  // For mobile, use AsyncStorage
  return AsyncStorage;
};

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: createStorage(),
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: Platform.OS === 'web',
  },
});