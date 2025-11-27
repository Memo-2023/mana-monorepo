import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * Type-safe wrapper for AsyncStorage with error handling
 */
export const safeStorage = {
	/**
	 * Store a value in AsyncStorage
	 * @param key Storage key
	 * @param value Value to store (automatically converted to JSON)
	 */
	setItem: async <T>(key: string, value: T): Promise<void> => {
		try {
			// Skip saving if value is undefined
			if (value === undefined) {
				console.warn(`Attempted to save undefined value for key: ${key}. Skipping.`);
				return;
			}
			const jsonValue = JSON.stringify(value);
			await AsyncStorage.setItem(key, jsonValue);
		} catch (e) {
			console.error('Error saving data to storage:', e);
		}
	},

	/**
	 * Retrieve a value from AsyncStorage
	 * @param key Storage key
	 * @returns The stored value or null if not found
	 */
	getItem: async <T>(key: string): Promise<T | null> => {
		try {
			const jsonValue = await AsyncStorage.getItem(key);
			return jsonValue != null ? JSON.parse(jsonValue) : null;
		} catch (e) {
			console.error('Error reading data from storage:', e);
			return null;
		}
	},

	/**
	 * Remove a value from AsyncStorage
	 * @param key Storage key
	 */
	removeItem: async (key: string): Promise<void> => {
		try {
			await AsyncStorage.removeItem(key);
		} catch (e) {
			console.error('Error removing data from storage:', e);
		}
	},

	/**
	 * Clear all values from AsyncStorage
	 */
	clear: async (): Promise<void> => {
		try {
			await AsyncStorage.clear();
		} catch (e) {
			console.error('Error clearing storage:', e);
		}
	},
};
