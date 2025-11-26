import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || '';

// Überprüfe, ob wir in einer Browser-Umgebung sind
const isBrowser = typeof window !== 'undefined';

// Importiere AsyncStorage nur, wenn wir in einer Browser-Umgebung sind
let AsyncStorage;
if (isBrowser) {
  AsyncStorage = require('@react-native-async-storage/async-storage').default;
}

// Erstelle Supabase-Client mit unterschiedlichen Konfigurationen je nach Umgebung
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: isBrowser
    ? {
        storage: AsyncStorage,
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: false,
      }
    : {
        // Dummy-Storage für serverseitiges Rendering
        storage: {
          getItem: () => Promise.resolve(null),
          setItem: () => Promise.resolve(),
          removeItem: () => Promise.resolve(),
        },
        autoRefreshToken: false,
        persistSession: false,
        detectSessionInUrl: false,
      },
});
