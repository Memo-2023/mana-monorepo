import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';
import { SUPABASE_URL, SUPABASE_ANON_KEY } from './config';

// Verwende die statischen Werte aus der Konfigurationsdatei
const supabaseUrl = SUPABASE_URL;
const supabaseAnonKey = SUPABASE_ANON_KEY;

// Custom storage implementation for React Native
const ExpoAsyncStorage = {
	getItem: async (key: string) => {
		try {
			return await AsyncStorage.getItem(key);
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

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
	auth: {
		storage: ExpoAsyncStorage,
		autoRefreshToken: true,
		persistSession: true,
		detectSessionInUrl: false,
	},
});
