import { createClient } from '@supabase/supabase-js';
import { Platform } from 'react-native';
import memoryStorage from './memoryStorage';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

// Überprüfen, ob die Umgebungsvariablen definiert sind
if (!supabaseUrl || !supabaseAnonKey) {
	console.error('Supabase URL oder Anon Key fehlen in den Umgebungsvariablen');
}

// Web-spezifische Konfiguration
const webConfig =
	Platform.OS === 'web'
		? {
				global: {
					headers: {
						'X-Client-Info': 'supabase-js-web',
					},
				},
				// Disable realtime for web to avoid import issues
				realtime: {
					params: {
						eventsPerSecond: 0,
					},
				},
			}
		: {};

export const supabase = createClient(supabaseUrl || '', supabaseAnonKey || '', {
	auth: {
		storage: memoryStorage, // Verwende benutzerdefinierte memoryStorage-Lösung
		autoRefreshToken: true,
		persistSession: true,
		detectSessionInUrl: false,
	},
	...webConfig,
});
