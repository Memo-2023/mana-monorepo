import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

// Prüfen, ob wir in einer Browser-Umgebung sind
const isBrowser = typeof window !== 'undefined';

// Nur AsyncStorage importieren, wenn wir in einer Browser-/React Native-Umgebung sind
let AsyncStorage;
if (isBrowser) {
	// Dynamischer Import, um SSR-Probleme zu vermeiden
	AsyncStorage = require('@react-native-async-storage/async-storage').default;
}

export const supabase = createClient(supabaseUrl || '', supabaseAnonKey || '', {
	auth: {
		storage: isBrowser ? AsyncStorage : undefined,
		autoRefreshToken: true,
		persistSession: isBrowser,
		detectSessionInUrl: false,
	},
});
