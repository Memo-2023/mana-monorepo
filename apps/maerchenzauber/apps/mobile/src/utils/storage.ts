import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';

class StorageAdapter {
	// Validate and sanitize key for SecureStore
	private sanitizeKey(key: string): string {
		if (!key || typeof key !== 'string') {
			console.warn('Invalid storage key:', key);
			return 'default_key';
		}
		// SecureStore only allows alphanumeric characters, ".", "-", and "_"
		// Replace invalid characters with underscores
		return key.replace(/[^a-zA-Z0-9._-]/g, '_');
	}

	async getItem(key: string): Promise<string | null> {
		if (!key) {
			console.warn('Empty key provided to storage.getItem');
			return null;
		}

		if (Platform.OS === 'web') {
			// Check if localStorage is available (it might not be in SSR)
			if (typeof window !== 'undefined' && window.localStorage) {
				return window.localStorage.getItem(key);
			}
			return null;
		} else {
			try {
				const sanitizedKey = this.sanitizeKey(key);
				return await SecureStore.getItemAsync(sanitizedKey);
			} catch (error) {
				console.warn('Error getting item from SecureStore:', error);
				return null;
			}
		}
	}

	async setItem(key: string, value: string): Promise<void> {
		if (!key || !value) {
			console.warn('Invalid key or value provided to storage.setItem');
			return;
		}

		if (Platform.OS === 'web') {
			if (typeof window !== 'undefined' && window.localStorage) {
				window.localStorage.setItem(key, value);
			}
		} else {
			try {
				const sanitizedKey = this.sanitizeKey(key);
				await SecureStore.setItemAsync(sanitizedKey, value);
			} catch (error) {
				console.warn('Error setting item in SecureStore:', error);
			}
		}
	}

	async removeItem(key: string): Promise<void> {
		if (!key) {
			console.warn('Empty key provided to storage.removeItem');
			return;
		}

		if (Platform.OS === 'web') {
			if (typeof window !== 'undefined' && window.localStorage) {
				window.localStorage.removeItem(key);
			}
		} else {
			try {
				const sanitizedKey = this.sanitizeKey(key);
				await SecureStore.deleteItemAsync(sanitizedKey);
			} catch (error) {
				console.warn('Error removing item from SecureStore:', error);
			}
		}
	}
}

export const storage = new StorageAdapter();
